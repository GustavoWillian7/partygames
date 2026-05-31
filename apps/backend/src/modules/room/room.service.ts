import { redis } from '../../config/redis';
import { hasActiveSocket } from '../../socketRegistry';
import { Room, Player, RoomSettings } from '@partygames/shared';
import { secureRandomInt } from '../../utils/cryptoRandom';

const RECONNECT_WINDOW_MS = 60_000;
const EMPTY_ROOM_TTL_MS = 30_000;
const MIN_PLAYERS_TO_START = 3;

const reconnectTimers = new Map<string, NodeJS.Timeout>();
const emptyRoomTimers = new Map<string, NodeJS.Timeout>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(secureRandomInt(chars.length));
  }
  return code;
}

async function roomExists(roomId: string): Promise<boolean> {
  const exists = await redis.exists(`room:${roomId}`);
  return exists === 1;
}

async function getRoomById(roomId: string): Promise<Room | null> {
  const data = await redis.get(`room:${roomId}`);
  if (!data) return null;
  return JSON.parse(data) as Room;
}

async function saveRoom(room: Room): Promise<void> {
  await redis.set(`room:${room.id}`, JSON.stringify(room));
}

async function deleteRoom(roomId: string): Promise<void> {
  await redis.del(`room:${roomId}`);
  clearEmptyRoomTimer(roomId);
}

function clearReconnectTimer(playerId: string): void {
  const timer = reconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(playerId);
  }
}

function clearEmptyRoomTimer(roomId: string): void {
  const timer = emptyRoomTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    emptyRoomTimers.delete(roomId);
  }
}

function scheduleRoomDeletion(roomId: string): void {
  clearEmptyRoomTimer(roomId);
  const timer = setTimeout(async () => {
    emptyRoomTimers.delete(roomId);
    const room = await getRoomById(roomId);
    if (room && room.players.length === 0) {
      await deleteRoom(roomId);
    }
  }, EMPTY_ROOM_TTL_MS);
  emptyRoomTimers.set(roomId, timer);
}

function removePlayer(room: Room, playerId: string): Player | undefined {
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return undefined;
  const [removed] = room.players.splice(idx, 1);
  return removed;
}

function transferHost(room: Room): string | undefined {
  const nextHost = room.players.find((p) => p.id !== room.hostId && p.status !== 'disconnected');
  if (!nextHost) return undefined;
  room.hostId = nextHost.id;
  nextHost.isHost = true;
  const oldHost = room.players.find((p) => p.isHost && p.id !== nextHost.id);
  if (oldHost) oldHost.isHost = false;
  return nextHost.id;
}

export const roomService = {
  async createRoom(
    name: string,
    settings: Partial<RoomSettings>,
    hostPlayer: Player
  ): Promise<Room> {
    console.log('[roomService.createRoom] generating code, redis status=', redis.status);
    let code = generateRoomCode();
    let attempts = 0;
    while (await roomExists(code)) {
      code = generateRoomCode();
      attempts++;
      if (attempts > 50) throw new Error('Failed to generate unique room code');
    }
    console.log('[roomService.createRoom] code generated', code);

    const now = new Date();
    const room: Room = {
      id: code,
      name: name || `Sala ${code}`,
      hostId: hostPlayer.id,
      players: [{ ...hostPlayer, isHost: true }],
      status: 'waiting',
      settings: {
        maxPlayers: settings.maxPlayers ?? 8,
        roundTimeSeconds: settings.roundTimeSeconds ?? 60,
        allowReconnection: settings.allowReconnection ?? true,
        isPublic: settings.isPublic ?? false,
      },
      createdAt: now,
      updatedAt: now,
    };

    await saveRoom(room);
    console.log('[roomService.createRoom] room saved to redis');
    await redis.set(`playerRoom:${hostPlayer.id}`, room.id);
    console.log('[roomService.createRoom] playerRoom mapping saved');
    return room;
  },

  async joinRoom(roomId: string, player: Player): Promise<Room> {
    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found');

    const kicked = await redis.get(`room:kick:${roomId}:${player.id}`);
    if (kicked) throw new Error('You were removed from this room');

    // Se sala estava em jogo mas o jogo já acabou no Redis, resetar para lobby
    if (room.status === 'playing') {
      const gameExists = await redis.exists(`game:${roomId}`);
      if (gameExists === 0) {
        room.status = 'waiting';
        room.currentGame = undefined;
      }
    }

    const existingPlayer = room.players.find((p) => p.id === player.id);
    if (existingPlayer) {
      // Jogador já está na sala — atualizar socket e status (reconexão/refresh)
      existingPlayer.socketId = player.socketId;
      existingPlayer.status = 'online';
      room.updatedAt = new Date();
      await saveRoom(room);
      await redis.set(`playerRoom:${player.id}`, room.id);
      clearEmptyRoomTimer(room.id);
      return room;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    if (room.status === 'playing') {
      player.status = 'spectator';
    }

    room.players.push(player);
    room.updatedAt = new Date();
    await saveRoom(room);
    await redis.set(`playerRoom:${player.id}`, room.id);
    clearEmptyRoomTimer(room.id);
    return room;
  },

  async leaveRoom(playerId: string): Promise<{ room: Room | null; removedPlayer: Player | undefined; newHostId?: string }> {
    const roomId = await redis.get(`playerRoom:${playerId}`);
    if (!roomId) return { room: null, removedPlayer: undefined };

    const room = await getRoomById(roomId);
    if (!room) {
      await redis.del(`playerRoom:${playerId}`);
      return { room: null, removedPlayer: undefined };
    }

    const wasHost = room.hostId === playerId;
    const removed = removePlayer(room, playerId);
    if (!removed) return { room, removedPlayer: undefined };

    clearReconnectTimer(playerId);
    await redis.del(`playerRoom:${playerId}`);

    let newHostId: string | undefined;
    if (wasHost && room.players.length > 0) {
      newHostId = transferHost(room);
    }

    if (room.players.length === 0) {
      scheduleRoomDeletion(room.id);
    } else {
      room.updatedAt = new Date();
      await saveRoom(room);
    }

    return { room, removedPlayer: removed, newHostId };
  },

  async kickPlayer(roomId: string, playerId: string, hostId: string): Promise<Room> {
    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostId) throw new Error('Only host can kick players');

    const removed = removePlayer(room, playerId);
    if (!removed) throw new Error('Player not in room');

    clearReconnectTimer(playerId);
    await redis.del(`playerRoom:${playerId}`);
    await redis.setex(`room:kick:${roomId}:${playerId}`, 30, '1');

    if (room.players.length === 0) {
      scheduleRoomDeletion(roomId);
    } else {
      room.updatedAt = new Date();
      await saveRoom(room);
    }

    return room;
  },

  async updateSettings(roomId: string, settings: Partial<RoomSettings>, hostId: string): Promise<Room> {
    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostId) throw new Error('Only host can update settings');

    if (settings.maxPlayers !== undefined) {
      if (settings.maxPlayers < 3 || settings.maxPlayers > 12) {
        throw new Error('maxPlayers must be between 3 and 12');
      }
      if (room.players.length > settings.maxPlayers) {
        throw new Error('Cannot set maxPlayers below current player count');
      }
    }

    room.settings = { ...room.settings, ...settings };
    room.updatedAt = new Date();
    await saveRoom(room);
    return room;
  },

  async startGame(roomId: string, gameType: 'impostor' | 'duo-chaos', hostId: string): Promise<Room> {
    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostId) throw new Error('Only host can start the game');
    if (room.status === 'playing') throw new Error('Game already in progress');

    const activePlayers = room.players.filter((p) => p.status !== 'spectator' && p.status !== 'disconnected');
    if (activePlayers.length < MIN_PLAYERS_TO_START) {
      throw new Error(`Need at least ${MIN_PLAYERS_TO_START} players to start`);
    }

    room.status = 'playing';
    room.currentGame = gameType;
    room.updatedAt = new Date();
    await saveRoom(room);
    return room;
  },

  async handleDisconnect(playerId: string, socketId: string): Promise<{ room: Room | null; player: Player | undefined }> {
    // Se o jogador ainda tem outras abas ativas, não marcar como desconectado
    if (hasActiveSocket(playerId)) {
      return { room: null, player: undefined };
    }

    const roomId = await redis.get(`playerRoom:${playerId}`);
    if (!roomId) return { room: null, player: undefined };

    const room = await getRoomById(roomId);
    if (!room) {
      await redis.del(`playerRoom:${playerId}`);
      return { room: null, player: undefined };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room, player: undefined };

    // Race condition fix: if player already reconnected with a different socket, ignore this disconnect
    if (player.socketId !== socketId) {
      return { room, player: undefined };
    }

    player.status = 'disconnected';
    await saveRoom(room);

    if (room.settings.allowReconnection) {
      clearReconnectTimer(playerId);
      const timer = setTimeout(async () => {
        reconnectTimers.delete(playerId);
        // Verificar novamente — o jogador pode ter reconectado durante a janela
        if (hasActiveSocket(playerId)) return;
        const { room: currentRoom, newHostId } = await this.leaveRoom(playerId);
        // Note: leaveRoom already handles host transfer and room deletion
      }, RECONNECT_WINDOW_MS);
      reconnectTimers.set(playerId, timer);
    } else {
      await this.leaveRoom(playerId);
    }

    return { room, player };
  },

  async handleReconnect(playerId: string, socketId: string): Promise<{ room: Room | null; player: Player | undefined; reconnected: boolean }> {
    clearReconnectTimer(playerId);

    const roomId = await redis.get(`playerRoom:${playerId}`);
    if (!roomId) return { room: null, player: undefined, reconnected: false };

    const room = await getRoomById(roomId);
    if (!room) {
      await redis.del(`playerRoom:${playerId}`);
      return { room: null, player: undefined, reconnected: false };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      await redis.del(`playerRoom:${playerId}`);
      return { room, player: undefined, reconnected: false };
    }

    player.status = 'online';
    player.socketId = socketId;
    room.updatedAt = new Date();
    await saveRoom(room);
    clearEmptyRoomTimer(room.id);

    return { room, player, reconnected: true };
  },

  async getRoom(roomId: string): Promise<Room | null> {
    return getRoomById(roomId);
  },

  async getPlayerRoomId(playerId: string): Promise<string | null> {
    return redis.get(`playerRoom:${playerId}`);
  },

  async updateRoom(room: Room): Promise<void> {
    await saveRoom(room);
  },
};
