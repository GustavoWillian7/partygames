import { Server as SocketServer, Socket } from 'socket.io';
import { roomService } from './room.service';
import { authService } from '../auth/auth.service';
import {
  createRoomSchema,
  joinRoomSchema,
  kickPlayerSchema,
  updateSettingsSchema,
  startGameSchema,
} from './room.schema';
import { getSocket } from '../../socketRegistry';
import { impostorService } from '../impostor/impostor.service';
import { duoChaosService } from '../duo-chaos/duo-chaos.service';
import type { Player } from '@partygames/shared';

async function buildPlayer(socketId: string, playerId: string): Promise<Player> {
  console.log('[buildPlayer] fetching profile for', playerId);
  const profile = await authService.getById(playerId);
  console.log('[buildPlayer] profile found?', !!profile);
  return {
    id: playerId,
    socketId,
    name: profile?.name || 'Jogador',
    status: 'online',
    isHost: false,
    score: 0,
    createdAt: new Date(),
  };
}

import { z } from 'zod';

function validatePayload<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid payload: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
  return result.data;
}

function buildImpostorCallbacks(io: SocketServer, roomId: string) {
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

function buildDuoChaosCallbacks(io: SocketServer, roomId: string) {
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

export function roomHandler(io: SocketServer, socket: Socket) {
  const playerId = socket.data.playerId as string | undefined;
  if (!playerId) {
    socket.emit('room:error', { message: 'Authentication required' });
    return;
  }

  socket.on('room:create', async (payload) => {
    console.log('[room:create] received from playerId=', playerId, 'payload=', payload);
    try {
      const data = validatePayload(createRoomSchema, payload);
      console.log('[room:create] payload validated');
      const player = await buildPlayer(socket.id, playerId);
      console.log('[room:create] player built', player.id);
      const room = await roomService.createRoom(data.name, data.settings ?? {}, player);
      console.log('[room:create] room created', room.id);
      socket.join(room.id);
      socket.emit('room:state', room);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      console.error('[room:create] error:', msg);
      socket.emit('room:error', { message: msg });
    }
  });

  socket.on('room:join', async (payload) => {
    try {
      const data = validatePayload(joinRoomSchema, payload);
      const player = await buildPlayer(socket.id, playerId);
      const room = await roomService.joinRoom(data.roomId, player);
      socket.join(room.id);
      socket.emit('room:state', room);
      socket.to(room.id).emit('room:player-joined', { player });
    } catch (err) {
      socket.emit('room:error', { message: err instanceof Error ? err.message : 'Failed to join room' });
    }
  });

  socket.on('room:leave', async () => {
    try {
      const { room, newHostId } = await roomService.leaveRoom(playerId);
      if (!room) return;
      socket.leave(room.id);
      io.to(room.id).emit('room:player-left', { playerId, newHostId });
    } catch (err) {
      socket.emit('room:error', { message: err instanceof Error ? err.message : 'Failed to leave room' });
    }
  });

  socket.on('room:kick', async (payload) => {
    try {
      const data = validatePayload(kickPlayerSchema, payload);
      const roomId = await roomService.getPlayerRoomId(playerId);
      if (!roomId) {
        socket.emit('room:error', { message: 'You are not in a room' });
        return;
      }
      const room = await roomService.kickPlayer(roomId, data.playerId, playerId);
      io.to(room.id).emit('room:player-left', { playerId: data.playerId });

      const kickedSocket = getSocket(data.playerId);
      if (kickedSocket) {
        kickedSocket.leave(room.id);
        kickedSocket.emit('room:error', { message: 'You were kicked from the room' });
      }
    } catch (err) {
      socket.emit('room:error', { message: err instanceof Error ? err.message : 'Failed to kick player' });
    }
  });

  socket.on('room:update-settings', async (payload) => {
    try {
      const data = validatePayload(updateSettingsSchema, payload);
      const roomId = await roomService.getPlayerRoomId(playerId);
      if (!roomId) {
        socket.emit('room:error', { message: 'You are not in a room' });
        return;
      }
      const room = await roomService.updateSettings(roomId, data, playerId);
      io.to(room.id).emit('room:state', room);
    } catch (err) {
      socket.emit('room:error', { message: err instanceof Error ? err.message : 'Failed to update settings' });
    }
  });

  socket.on('room:start-game', async (payload) => {
    try {
      const data = validatePayload(startGameSchema, payload);
      const roomId = await roomService.getPlayerRoomId(playerId);
      if (!roomId) {
        socket.emit('room:error', { message: 'You are not in a room' });
        return;
      }
      const room = await roomService.startGame(roomId, data.gameType, playerId);

      // Inicializar jogo específico
      if (data.gameType === 'impostor') {
        const callbacks = buildImpostorCallbacks(io, roomId);
        await impostorService.startGame(roomId, room.players, callbacks, room.settings.themeGroup);
      } else if (data.gameType === 'duo-chaos') {
        const callbacks = buildDuoChaosCallbacks(io, roomId);
        await duoChaosService.startGame(roomId, room.players, callbacks, room.settings.themeGroup);
      }

      io.to(room.id).emit('room:state', room);
      io.to(room.id).emit('room:game-started', {
        gameType: data.gameType,
        initialState: buildInitialState(room, data.gameType),
      });
    } catch (err) {
      socket.emit('room:error', { message: err instanceof Error ? err.message : 'Failed to start game' });
    }
  });

  socket.on('disconnect', async () => {
    try {
      const { room, player } = await roomService.handleDisconnect(playerId, socket.id);
      if (room && player) {
        io.to(room.id).emit('room:player-left', { playerId });
      }
    } catch (err) {
      console.error('[room:disconnect error]', err);
    }
  });
}

function buildInitialState(room: import('@partygames/shared').Room, gameType: 'impostor' | 'duo-chaos'): import('@partygames/shared').GameState {
  const activePlayers = room.players.filter((p) => p.status !== 'spectator');
  return {
    gameType,
    phase: 'setup',
    currentRound: 1,
    timeRemaining: room.settings.roundTimeSeconds,
    players: activePlayers,
    eliminatedPlayerIds: [],
    metadata: {},
  };
}
