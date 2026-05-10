import { Server as SocketServer, Socket } from 'socket.io';
import { z } from 'zod';
import { duoChaosService } from './duo-chaos.service';
import { sendWordSchema, markPairSchema } from './duo-chaos.schema';
import { getSocket } from '../../socketRegistry';

function validatePayload<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid payload: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
  return result.data;
}

export function duoChaosHandler(io: SocketServer, socket: Socket) {
  const playerId = socket.data.playerId as string | undefined;
  if (!playerId) {
    socket.emit('error', { code: 'AUTH_ERROR', message: 'Authentication required' });
    return;
  }

  socket.on('duo-chaos:send-word', async (payload) => {
    try {
      const data = validatePayload(sendWordSchema, payload);
      const socketRoomId = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (!socketRoomId) throw new Error('Not in a room');

      const callbacks = buildCallbacks(io, socketRoomId);
      await duoChaosService.sendWord(socketRoomId, playerId, data.word, callbacks);
    } catch (err) {
      socket.emit('error', {
        code: 'GAME_ERROR',
        message: err instanceof Error ? err.message : 'Failed to send word',
      });
    }
  });

  socket.on('duo-chaos:mark-pair', async (payload) => {
    try {
      const data = validatePayload(markPairSchema, payload);
      const socketRoomId = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (!socketRoomId) throw new Error('Not in a room');

      const callbacks = buildCallbacks(io, socketRoomId);
      await duoChaosService.markPair(socketRoomId, playerId, data.targetPlayerId, callbacks);
    } catch (err) {
      socket.emit('error', {
        code: 'GAME_ERROR',
        message: err instanceof Error ? err.message : 'Failed to mark pair',
      });
    }
  });

  socket.on('duo-chaos:request-state', async () => {
    try {
      const socketRoomId = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (!socketRoomId) throw new Error('Not in a room');

      const callbacks = buildCallbacks(io, socketRoomId);
      await duoChaosService.sendCurrentState(socketRoomId, playerId, callbacks);
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
      const { roomService } = await import('../room/room.service');
      const room = await roomService.getRoom(_roomId);
      return room?.players ?? [];
    },
  };
}
