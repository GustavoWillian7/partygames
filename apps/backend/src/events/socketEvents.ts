import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { roomHandler } from '../modules/room/room.handler';

export function registerSocketEvents(io: SocketServer) {
  io.on('connection', (socket: Socket) => {
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

    socket.data.playerId = playerId;

    roomHandler(io, socket);
    // TODO: register impostorHandler and duoChaosHandler when game modules are built

    socket.on('disconnect', () => {
      // Reconnection and cleanup logic handled in roomHandler
    });
  });
}
