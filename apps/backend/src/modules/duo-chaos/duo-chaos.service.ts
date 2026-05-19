import { redis } from '../../config/redis';
import type { Player } from '@partygames/shared';
import type { DuoChaosGame } from './duo-chaos.types';
import {
  assignRoles,
  getNextTurnPlayer,
  checkMutualMark,
  checkGameOver,
  buildGamePayload,
  pickWords,
  getPlayerWord,
  buildPlayerWords,
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

async function setNextAction(roomId: string, ms: number): Promise<void> {
  const game = await getGame(roomId);
  if (game) {
    game.nextActionAt = Date.now() + ms;
    await saveGame(game);
  }
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
  onGameFinished?: (roomId: string) => Promise<void>;
}

export async function recoverDuoChaosGames(callbacksFactory: (roomId: string) => DuoChaosCallbacks): Promise<void> {
  const keys = await redis.keys('game:*');
  for (const key of keys) {
    const data = await redis.get(key);
    if (!data) continue;
    const game = JSON.parse(data) as DuoChaosGame;
    if (game.status === 'finished') continue;
    if (!game.nextActionAt) continue;

    const remaining = game.nextActionAt - Date.now();
    if (remaining <= 0) {
      const callbacks = callbacksFactory(game.roomId);
      await duoChaosService.endTurn(game.roomId, callbacks);
    } else {
      scheduleTimer(game.roomId, remaining, () => {
        const callbacks = callbacksFactory(game.roomId);
        duoChaosService.endTurn(game.roomId, callbacks);
      });
    }
  }
}

export const duoChaosService = {
  async startGame(roomId: string, players: Player[], callbacks: DuoChaosCallbacks, themeGroup?: string): Promise<void> {
    const activePlayers = players.filter((p) => p.status !== 'spectator');
    const activeIds = activePlayers.map((p) => p.id);

    const { pairs, impostorIds, pairCount } = assignRoles(activeIds);
    const wordSets = pickWords(pairCount, themeGroup);
    const { playerWords, theme } = buildPlayerWords(pairs, impostorIds, wordSets);
    const firstTurn = activeIds[0];

    const game: DuoChaosGame = {
      roomId,
      status: 'playing',
      pairs,
      impostorIds,
      playerWords,
      theme,
      turnPlayerId: firstTurn,
      activePlayerIds: activeIds,
      eliminatedPlayerIds: [],
      wordsGiven: {},
      markedPair: {},
      chatHistory: [],
      turnTimerEndsAt: Date.now() + TURN_TIME_MS,
    };

    await saveGame(game);

    // Enviar palavra individual para cada jogador
    for (const p of activePlayers) {
      const playerWord = getPlayerWord(p.id, impostorIds, playerWords);
      callbacks.emitToPlayer(p.id, 'duo-chaos:turn-start', {
        turnPlayerId: firstTurn,
        timeRemaining: Math.ceil(TURN_TIME_MS / 1000),
        yourWord: playerWord,
        yourTheme: theme,
        isImpostor: impostorIds.includes(p.id),
      });
    }

    const payload = buildGamePayload(game, activePlayers);
    callbacks.emitToRoom('duo-chaos:turn-start', payload);

    scheduleTimer(roomId, TURN_TIME_MS, () => {
      this.endTurn(roomId, callbacks);
    });
    await setNextAction(roomId, TURN_TIME_MS);
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
    await setNextAction(roomId, TURN_TIME_MS);
  },

  async markPair(roomId: string, playerId: string, targetId: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'playing') throw new Error('Game not in progress');
    if (playerId === targetId) throw new Error('Cannot mark yourself');

    // Só permite marcar dupla após todos terem falado pelo menos 1 palavra
    const allPlayersSpoken = game.activePlayerIds.every((id) =>
      game.chatHistory.some((msg) => msg.playerId === id)
    );
    if (!allPlayersSpoken) {
      throw new Error('Aguarde todos os jogadores falarem pelo menos 1 vez');
    }

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
        await setNextAction(roomId, REVEAL_TIME_MS);
      }
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

    // Notificar que o jogo terminou para atualizar a sala
    if (callbacks.onGameFinished) {
      try {
        await callbacks.onGameFinished(roomId);
      } catch (err) {
        console.error('[duo-chaos.finishGame] onGameFinished failed:', err);
      }
    }
  },

  async sendCurrentState(roomId: string, playerId: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) return;

    const players = await callbacks.getRoomPlayers(roomId);
    const payload = buildGamePayload(game, players);

    const playerWord = getPlayerWord(playerId, game.impostorIds, game.playerWords);

    callbacks.emitToPlayer(playerId, 'duo-chaos:state', {
      ...payload,
      yourWord: playerWord,
      yourTheme: game.theme,
      isImpostor: game.impostorIds.includes(playerId),
    });
  },

  async playerLeft(roomId: string, playerId: string, callbacks: DuoChaosCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game || game.status === 'finished') return;

    if (!game.activePlayerIds.includes(playerId)) return;
    if (!game.eliminatedPlayerIds.includes(playerId)) {
      game.eliminatedPlayerIds.push(playerId);
    }

    // Remover marcação de dupla do jogador que saiu
    delete game.markedPair[playerId];
    for (const [k, v] of Object.entries(game.markedPair)) {
      if (v === playerId) delete game.markedPair[k];
    }

    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    const remainingActive = game.activePlayerIds.filter((id) => !game.eliminatedPlayerIds.includes(id));

    // Se ficou muito pouco jogador, finalizar jogo
    if (remainingActive.length < 3) {
      const nonImpostor = remainingActive.filter((id) => !game.impostorIds.includes(id));
      const remainingImpostors = remainingActive.filter((id) => game.impostorIds.includes(id));
      if (remainingImpostors.length === 0 && nonImpostor.length >= 2) {
        await this.finishGame(roomId, nonImpostor, 'Os impostores foram eliminados!', callbacks);
      } else if (remainingImpostors.length > 0 && nonImpostor.length <= remainingImpostors.length) {
        await this.finishGame(roomId, remainingImpostors, 'Os impostores dominaram!', callbacks);
      }
      return;
    }

    // Se o jogador da vez saiu, avançar turno
    if (game.turnPlayerId === playerId) {
      clearGameTimer(roomId);
      await this.endTurn(roomId, callbacks);
    }
  },

  async getGameState(roomId: string): Promise<DuoChaosGame | null> {
    return getGame(roomId);
  },

  async abandonGame(roomId: string): Promise<void> {
    await deleteGame(roomId);
  },
};
