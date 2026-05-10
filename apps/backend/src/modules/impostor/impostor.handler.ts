import { Server as SocketServer, Socket } from 'socket.io';
import { z } from 'zod';
import { impostorService } from './impostor.service';
import { sendClueSchema, voteSchema } from './impostor.schema';
import { getSocket } from '../../socketRegistry';

function validatePayload<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid payload: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
  return result.data;
}

export function impostorHandler(io: SocketServer, socket: Socket) {
  const playerId = socket.data.playerId as string | undefined;
  if (!playerId) {
    socket.emit('error', { code: 'AUTH_ERROR', message: 'Authentication required' });
    return;
  }

  socket.on('impostor:send-clue', async (payload) => {
    try {
      const data = validatePayload(sendClueSchema, payload);
      const socketRoomId = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (!socketRoomId) throw new Error('Not in a room');

      const callbacks = buildCallbacks(io, socketRoomId);
      await impostorService.sendClue(socketRoomId, playerId, data.word, callbacks);
    } catch (err) {
      socket.emit('error', {
        code: 'GAME_ERROR',
        message: err instanceof Error ? err.message : 'Failed to send clue',
      });
    }
  });

  socket.on('impostor:vote', async (payload) => {
    try {
      const data = validatePayload(voteSchema, payload);
      const socketRoomId = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (!socketRoomId) throw new Error('Not in a room');

      const callbacks = buildCallbacks(io, socketRoomId);
      await impostorService.submitVote(socketRoomId, playerId, data.votedPlayerId, callbacks);
    } catch (err) {
      socket.emit('error', {
        code: 'GAME_ERROR',
        message: err instanceof Error ? err.message : 'Failed to vote',
      });
    }
  });

  socket.on('impostor:request-state', async () => {
    try {
      const socketRoomId = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (!socketRoomId) throw new Error('Not in a room');

      const callbacks = buildCallbacks(io, socketRoomId);
      await impostorService.sendCurrentState(socketRoomId, playerId, callbacks);
    } catch (err) {
      socket.emit('error', {
        code: 'GAME_ERROR',
        message: err instanceof Error ? err.message : 'Failed to get game state',
      });
    }
  });
}

function buildCallbacks(io: SocketServer, roomId: string) {
  return {
    emitToRoom: (event: string, payload: unknown) => {
      io.to(roomId).emit(event, payload);
    },
    emitToPlayer: (playerId: string, event: string, payload: unknown) => {
      const targetSocket = getSocket(playerId);
      if (targetSocket) {
        targetSocket.emit(event, payload);
      }
    },
    getRoomPlayers: async (_roomId: string) => {
      // Importar dinamicamente para evitar circular dependency
      const { roomService } = await import('../room/room.service');
      const room = await roomService.getRoom(_roomId);
      return room?.players ?? [];
    },
  };
}
