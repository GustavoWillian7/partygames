import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { roomService } from '../modules/room/room.service';
import { roomHandler } from '../modules/room/room.handler';
import { impostorHandler } from '../modules/impostor/impostor.handler';
import { duoChaosHandler } from '../modules/duo-chaos/duo-chaos.handler';
import { registerSocket, unregisterSocket } from '../socketRegistry';

export function registerSocketEvents(io: SocketServer) {
  io.on('connection', async (socket: Socket) => {
    const token = socket.handshake.auth?.token as string | undefined;
    let playerId: string | undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { playerId: string };
        playerId = decoded.playerId;
      } catch {
        socket.emit('error', { code: 'AUTH_ERROR', message: 'Invalid token' });
        socket.disconnect(true);
        return;
      }
    }

    if (!playerId) {
      socket.emit('error', { code: 'AUTH_ERROR', message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    socket.data.playerId = playerId;
    registerSocket(playerId, socket);

    // Attempt reconnection
    const { room, player, reconnected } = await roomService.handleReconnect(playerId, socket.id);
    if (reconnected && room && player) {
      socket.join(room.id);
      socket.emit('room:state', room);
      socket.to(room.id).emit('room:player-reconnected', { player });
    }

    roomHandler(io, socket);
    impostorHandler(io, socket);
    duoChaosHandler(io, socket);

    socket.on('disconnect', () => {
      unregisterSocket(playerId, socket);
    });
  });
}
