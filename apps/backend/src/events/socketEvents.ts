import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { roomService } from '../modules/room/room.service';
import { roomHandler } from '../modules/room/room.handler';
import { impostorHandler } from '../modules/impostor/impostor.handler';
import { duoChaosHandler } from '../modules/duo-chaos/duo-chaos.handler';
import { impostorService } from '../modules/impostor/impostor.service';
import { duoChaosService } from '../modules/duo-chaos/duo-chaos.service';
import { registerSocket, unregisterSocket } from '../socketRegistry';

const SESSION_TTL_SECONDS = 86400; // 24h

export function registerSocketEvents(io: SocketServer) {
  io.on('connection', async (socket: Socket) => {
    const token = socket.handshake.auth?.token as string | undefined;
    let playerId: string | undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { playerId: string };
        playerId = decoded.playerId;
      } catch {
        socket.emit('error', { code: 'AUTH_ERROR', message: 'Token inválido' });
        socket.disconnect(true);
        return;
      }
    }

    if (!playerId) {
      socket.emit('error', { code: 'AUTH_ERROR', message: 'Autenticação necessária' });
      socket.disconnect(true);
      return;
    }

    socket.data.playerId = playerId;

    // Verificar sessão única (login único)
    const sessionKey = `auth:session:${playerId}`;
    const existingSession = await redis.get(sessionKey);
    if (existingSession && existingSession !== (token ?? '1')) {
      socket.emit('error', { code: 'AUTH_ERROR', message: 'Esta conta já está em uso em outro dispositivo' });
      socket.disconnect(true);
      return;
    }

    registerSocket(playerId, socket);

    // Atualizar sessão ativa no Redis (para rastreamento de login único)
    await redis.set(sessionKey, token ?? '1', 'EX', SESSION_TTL_SECONDS);

    // Attempt reconnection
    const { room, player, reconnected } = await roomService.handleReconnect(playerId, socket.id);
    if (reconnected && room && player) {
      socket.join(room.id);
      socket.emit('room:state', room);
      socket.to(room.id).emit('room:player-reconnected', { player });

      // Se a sala está em jogo, reenviar estado do jogo para o jogador reconectado
      if (room.status === 'playing' && room.currentGame) {
        try {
          if (room.currentGame === 'impostor') {
            const callbacks = {
              emitToRoom: () => {},
              emitToPlayer: (pid: string, event: string, payload: unknown) => {
                if (pid === playerId) socket.emit(event, payload);
              },
              getRoomPlayers: async () => room?.players ?? [],
            };
            await impostorService.sendCurrentState(room.id, playerId, callbacks);
          } else if (room.currentGame === 'duo-chaos') {
            const callbacks = {
              emitToRoom: () => {},
              emitToPlayer: (pid: string, event: string, payload: unknown) => {
                if (pid === playerId) socket.emit(event, payload);
              },
              getRoomPlayers: async () => room?.players ?? [],
            };
            await duoChaosService.sendCurrentState(room.id, playerId, callbacks);
          }
        } catch (err) {
          console.error('[reconnect] Failed to send game state:', err);
        }
      }
    }

    roomHandler(io, socket);
    impostorHandler(io, socket);
    duoChaosHandler(io, socket);

    socket.on('disconnect', () => {
      unregisterSocket(playerId, socket);
      // Só limpar a sessão do Redis se não houver mais sockets ativos para este player
      const { hasActiveSocket } = require('../socketRegistry');
      if (!hasActiveSocket(playerId)) {
        redis.del(`auth:session:${playerId}`).catch(() => {});
      }
    });
  });
}
