import { redis } from '../../config/redis';
import type { Player } from '@partygames/shared';
import type { DuoChaosGame } from './duo-chaos.types';
import {
  assignRoles,
  getNextTurnPlayer,
  checkMutualMark,
  checkGameOver,
  buildGamePayload,
} from './duo-chaos.logic';

const TURN_TIME_MS = 30_000;
const REVEAL_TIME_MS = 5_000;

const gameTimers = new Map<string, NodeJS.Timeout>();

function clearGameTimer(roomId: string): void {
  const t = gameTimers.get(roomId);
  if (t) {
    clearTimeout(t);
    gameTimers.delete(roomId);
  }
}

function scheduleTimer(roomId: string, ms: number, cb: () => void): void {
  clearGameTimer(roomId);
  gameTimers.set(roomId, setTimeout(cb, ms));
}

async function getGame(roomId: string): Promise<DuoChaosGame | null> {
  const data = await redis.get(`game:${roomId}`);
  if (!data) return null;
  return JSON.parse(data) as DuoChaosGame;
}

async function saveGame(game: DuoChaosGame): Promise<void> {
  await redis.set(`game:${game.roomId}`, JSON.stringify(game));
}

async function deleteGame(roomId: string): Promise<void> {
  await redis.del(`game:${roomId}`);
  clearGameTimer(roomId);
}

export interface DuoChaosCallbacks {
  emitToRoom: (event: string, payload: unknown) => void;
  emitToPlayer: (playerId: string, event: string, payload: unknown) => void;
  getRoomPlayers: (roomId: string) => Promise<Player[]>;
}

export const duoChaosService = {
  async startGame(roomId: string, players: Player[], callbacks: DuoChaosCallbacks): Promise<void> {
    const activePlayers = players.filter((p) => p.status !== 'spectator');
    const activeIds = activePlayers.map((p) => p.id);

    const { pairs, impostorIds, soloPlayerId } = assignRoles(activeIds);
    const firstTurn = activeIds[0];

    const game: DuoChaosGame = {
      roomId,
      status: 'playing',
      pairs,
      impostorIds,
      soloPlayerId,
      turnPlayerId: firstTurn,
      activePlayerIds: activeIds,
      eliminatedPlayerIds: [],
      wordsGiven: {},
      markedPair: {},
      chatHistory: [],
      turnTimerEndsAt: Date.now() + TURN_TIME_MS,
    };

    await saveGame(game);

    for (const p of activePlayers) {
      const isPair = pairs[p.id] !== undefined;
      const isImpostor = impostorIds.includes(p.id);
      const isSolo = soloPlayerId === p.id;
      callbacks.emitToPlayer(p.id, 'duo-chaos:turn-start', {
        turnPlayerId: firstTurn,
        timeRemaining: Math.ceil(TURN_TIME_MS / 1000),
        yourRole: isImpostor ? 'impostor' : isPair ? 'pair' : 'solo',
        yourPartnerId: isPair ? pairs[p.id] : undefined,
      });
    }

    const payload = buildGamePayload(game, activePlayers);
    callbacks.emitToRoom('duo-chaos:turn-start', payload);

    scheduleTimer(roomId, TURN_TIME_MS, () => {
      this.endTurn(roomId, callbacks);
    });
  },

  async sendWord(roomId: string, playerId: string, word: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'playing') throw new Error('Game not in progress');
    if (game.turnPlayerId !== playerId) throw new Error('Not your turn');
    if (game.wordsGiven[playerId]) throw new Error('Word already given this turn');

    game.wordsGiven[playerId] = word;
    game.chatHistory.push({ playerId, word, timestamp: new Date() });
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    callbacks.emitToRoom('duo-chaos:word-received', { playerId, word });

    clearGameTimer(roomId);
    await this.endTurn(roomId, callbacks);
  },

  async endTurn(roomId: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game || game.status !== 'playing') return;

    const nextTurnId = getNextTurnPlayer(game.turnPlayerId, game.activePlayerIds);
    game.turnPlayerId = nextTurnId;
    game.wordsGiven = {};
    game.turnTimerEndsAt = Date.now() + TURN_TIME_MS;
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    callbacks.emitToRoom('duo-chaos:turn-start', {
      ...buildGamePayload(game, players),
      turnPlayerId: nextTurnId,
    });

    scheduleTimer(roomId, TURN_TIME_MS, () => {
      this.endTurn(roomId, callbacks);
    });
  },

  async markPair(roomId: string, playerId: string, targetId: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'playing') throw new Error('Game not in progress');
    if (playerId === targetId) throw new Error('Cannot mark yourself');

    game.markedPair[playerId] = targetId;
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    callbacks.emitToRoom('duo-chaos:pair-marked', { playerId, targetId });

    const { mutual, a, b } = checkMutualMark(game.markedPair);
    if (mutual && a && b) {
      const result = checkGameOver(a, b, game.pairs, game.impostorIds);
      if (result.gameOver) {
        scheduleTimer(roomId, REVEAL_TIME_MS, () => {
          this.finishGame(roomId, result.winnerIds, result.reason, callbacks);
        });
      }
      // Se não for game over (dois solos se marcando), continua normalmente
    }
  },

  async finishGame(roomId: string, winnerIds: string[], reason: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) return;

    game.status = 'finished';
    await saveGame(game);

    callbacks.emitToRoom('duo-chaos:game-over', { winnerIds, reason });
    clearGameTimer(roomId);
    scheduleTimer(roomId, 300_000, () => {
      deleteGame(roomId);
    });
  },

  async sendCurrentState(roomId: string, playerId: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) return;

    const players = await callbacks.getRoomPlayers(roomId);
    const payload = buildGamePayload(game, players);

    const isPair = game.pairs[playerId] !== undefined;
    const isImpostor = game.impostorIds.includes(playerId);

    callbacks.emitToPlayer(playerId, 'duo-chaos:state', {
      ...payload,
      yourRole: isImpostor ? 'impostor' : isPair ? 'pair' : 'solo',
      yourPartnerId: isPair ? game.pairs[playerId] : undefined,
    });
  },

  async abandonGame(roomId: string): Promise<void> {
    await deleteGame(roomId);
  },
};
