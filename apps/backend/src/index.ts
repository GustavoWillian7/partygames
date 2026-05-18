import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env';
import { connectMongo } from './config/mongo';
import { redis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import { registerSocketEvents } from './events/socketEvents';
import { recoverImpostorGames } from './modules/impostor/impostor.service';
import { recoverDuoChaosGames } from './modules/duo-chaos/duo-chaos.service';
import { roomService } from './modules/room/room.service';
import { getAllSockets } from './socketRegistry';

async function main() {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);

  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN },
  });

  function buildImpostorCallbacks(roomId: string) {
    return {
      emitToRoom: (event: string, payload: unknown) => {
        io.to(roomId).emit(event, payload);
      },
      emitToPlayer: (playerId: string, event: string, payload: unknown) => {
        for (const s of getAllSockets(playerId)) {
          s.emit(event, payload);
        }
      },
      getRoomPlayers: async (_roomId: string) => {
        const room = await roomService.getRoom(_roomId);
        return room?.players ?? [];
      },
      onGameFinished: async (_roomId: string) => {
        const room = await roomService.getRoom(_roomId);
        if (room) {
          room.status = 'waiting';
          room.currentGame = undefined;
          room.updatedAt = new Date();
          await roomService.updateRoom(room);
          io.to(_roomId).emit('room:state', room);
        }
      },
    };
  }

  registerSocketEvents(io);

  // Recovery de timers após reinício do servidor
  try {
    await recoverImpostorGames(buildImpostorCallbacks);
    await recoverDuoChaosGames(buildImpostorCallbacks);
    console.log('[Server] Game timers recovered.');
  } catch (err) {
    console.error('[Server] Failed to recover game timers:', err);
  }

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} received. Shutting down gracefully...`);

    // 1. Desconectar todos os sockets ativos
    const sockets = await io.fetchSockets();
    console.log(`[Server] Disconnecting ${sockets.length} active socket(s)...`);
    for (const socket of sockets) {
      socket.emit('server:shutdown', { message: 'Servidor está sendo reiniciado. Você será desconectado.' });
      socket.disconnect(true);
    }

    // 2. Limpar salas e jogos do Redis
    console.log('[Server] Cleaning up Redis data...');
    const roomKeys = await redis.keys('room:*');
    const gameKeys = await redis.keys('game:*');
    const registryKeys = await redis.keys('socket:*');
    const allKeys = [...roomKeys, ...gameKeys, ...registryKeys];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
      console.log(`[Server] Deleted ${allKeys.length} key(s) from Redis.`);
    } else {
      console.log('[Server] No Redis keys to clean.');
    }

    // 3. Fechar servidor HTTP
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
    });

    // 4. Fechar conexões
    io.close(() => {
      console.log('[Server] Socket.io closed.');
    });

    try {
      await redis.quit();
      console.log('[Server] Redis disconnected.');
    } catch {
      console.log('[Server] Redis already disconnected.');
    }

    // Dar um tempinho para os sockets processarem o evento antes de matar o processo
    setTimeout(() => {
      console.log('[Server] Goodbye!');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
