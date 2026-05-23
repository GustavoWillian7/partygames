import { redis } from '../../config/redis';
import type { Player } from '@partygames/shared';
import type { ImpostorGame, ImpostorRound } from './impostor.types';
import {
  pickWord,
  assignImpostors,
  countVotes,
  checkGameOver,
  allPlayersGaveClue,
  allPlayersVoted,
  buildGamePayload,
  getPlayerWord,
  shuffleTurnOrder,
} from './impostor.logic';

const ROUND_TIME_MS = 60_000;
const VOTING_TIME_MS = 30_000;
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

async function getGame(roomId: string): Promise<ImpostorGame | null> {
  const data = await redis.get(`game:${roomId}`);
  if (!data) return null;
  return JSON.parse(data) as ImpostorGame;
}

async function saveGame(game: ImpostorGame): Promise<void> {
  await redis.set(`game:${game.roomId}`, JSON.stringify(game));
}

async function deleteGame(roomId: string): Promise<void> {
  await redis.del(`game:${roomId}`);
  clearGameTimer(roomId);
}

export interface ImpostorCallbacks {
  emitToRoom: (event: string, payload: unknown) => void;
  emitToPlayer: (playerId: string, event: string, payload: unknown) => void;
  getRoomPlayers: (roomId: string) => Promise<Player[]>;
  onGameFinished?: (roomId: string) => Promise<void>;
}

export async function recoverImpostorGames(callbacksFactory: (roomId: string) => ImpostorCallbacks): Promise<void> {
  const keys = await redis.keys('game:*');
  for (const key of keys) {
    const data = await redis.get(key);
    if (!data) continue;
    const game = JSON.parse(data) as ImpostorGame;
    if (game.status === 'finished') continue;
    if (!game.nextActionAt) continue;

    const remaining = game.nextActionAt - Date.now();
    if (remaining <= 0) {
      // Timer já expirou — executar imediatamente
      const callbacks = callbacksFactory(game.roomId);
      if (game.status === 'playing') {
        await impostorService.endRoundClues(game.roomId, callbacks);
      } else if (game.status === 'voting') {
        await impostorService.endVoting(game.roomId, callbacks);
      }
    } else {
      // Reagendar timer
      scheduleTimer(game.roomId, remaining, () => {
        const callbacks = callbacksFactory(game.roomId);
        if (game.status === 'playing') {
          impostorService.endRoundClues(game.roomId, callbacks);
        } else if (game.status === 'voting') {
          impostorService.endVoting(game.roomId, callbacks);
        }
      });
    }
  }
}

export const impostorService = {
  async startGame(roomId: string, players: Player[], callbacks: ImpostorCallbacks, themeGroup?: string): Promise<void> {
    const activePlayers = players.filter((p) => p.status !== 'spectator');
    const activeIds = activePlayers.map((p) => p.id);

    const { word, theme } = pickWord(themeGroup);
    const impostorCount = activeIds.length <= 4 ? 1 : activeIds.length <= 6 ? 1 : 2;
    const impostorIds = assignImpostors(activeIds, impostorCount);

    const turnOrder = shuffleTurnOrder(activeIds);

    const round: ImpostorRound = {
      roundNumber: 1,
      clues: {},
      votes: {},
      status: 'clues',
      turnOrder,
      currentTurnIndex: 0,
    };

    const game: ImpostorGame = {
      roomId,
      status: 'playing',
      currentRound: 1,
      secretWord: word,
      impostorTheme: theme,
      impostorIds,
      activePlayerIds: activeIds,
      eliminatedPlayerIds: [],
      rounds: [round],
      roundTimerEndsAt: Date.now() + ROUND_TIME_MS,
    };

    await saveGame(game);

    // Enviar palavra/tema individual para cada jogador
    // Civis recebem a palavra secreta, impostor recebe só o tema + aviso
    for (const p of activePlayers) {
      const { word: playerWord, theme: playerTheme, isImpostor } = getPlayerWord(
        p.id,
        impostorIds,
        word,
        theme
      );
      callbacks.emitToPlayer(p.id, 'impostor:round-start', {
        round: 1,
        timeRemaining: Math.ceil(ROUND_TIME_MS / 1000),
        yourWord: playerWord,
        yourTheme: playerTheme,
        isImpostor,
      });
    }

    // Broadcast de estado público
    const payload = buildGamePayload(game, activePlayers);
    callbacks.emitToRoom('impostor:round-start', {
      ...payload,
      turnPlayerId: turnOrder[0],
    });

    // Timer de rodada
    scheduleTimer(roomId, ROUND_TIME_MS, () => {
      this.endRoundClues(roomId, callbacks);
    });
    await setNextAction(roomId, ROUND_TIME_MS);
  },

  async sendClue(roomId: string, playerId: string, word: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'playing') throw new Error('Not in clue phase');

    const round = game.rounds[game.currentRound - 1];
    if (round.clues[playerId]) throw new Error('Clue already given');
    if (game.eliminatedPlayerIds.includes(playerId)) throw new Error('Eliminated players cannot play');

    // Verificar se é a vez do jogador
    const currentTurnPlayerId = round.turnOrder[round.currentTurnIndex];
    if (playerId !== currentTurnPlayerId) {
      throw new Error('Não é a sua vez de dar a dica');
    }

    round.clues[playerId] = word;

    // Avançar para o próximo jogador na ordem que ainda não deu dica
    let nextIndex = round.currentTurnIndex + 1;
    const activeIds = game.activePlayerIds.filter((id) => !game.eliminatedPlayerIds.includes(id));
    while (nextIndex < round.turnOrder.length) {
      const nextPlayerId = round.turnOrder[nextIndex];
      if (activeIds.includes(nextPlayerId) && round.clues[nextPlayerId] === undefined) {
        break;
      }
      nextIndex++;
    }
    round.currentTurnIndex = nextIndex;
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    callbacks.emitToRoom('impostor:clue-received', { playerId, word });

    // Notificar próximo jogador da vez (se houver)
    if (nextIndex < round.turnOrder.length) {
      const nextTurnPlayerId = round.turnOrder[nextIndex];
      callbacks.emitToRoom('impostor:turn-changed', { turnPlayerId: nextTurnPlayerId });
    }

    const remainingActive = activeIds.filter((id) => round.clues[id] === undefined);
    if (remainingActive.length === 0) {
      clearGameTimer(roomId);
      // Delay de 3s para todos verem a última dica antes da votação
      scheduleTimer(roomId, 3_000, () => {
        this.endRoundClues(roomId, callbacks);
      });
      await setNextAction(roomId, 3_000);
    }
  },

  async endRoundClues(roomId: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game || game.status !== 'playing') return;

    const round = game.rounds[game.currentRound - 1];
    round.status = 'voting';
    game.status = 'voting';
    game.votingTimerEndsAt = Date.now() + VOTING_TIME_MS;
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    const activePlayers = players.filter(
      (p) => game.activePlayerIds.includes(p.id) && !game.eliminatedPlayerIds.includes(p.id)
    );

    callbacks.emitToRoom('impostor:voting-start', { players: activePlayers });

    scheduleTimer(roomId, VOTING_TIME_MS, () => {
      this.endVoting(roomId, callbacks);
    });
    await setNextAction(roomId, VOTING_TIME_MS);
  },

  async submitVote(roomId: string, voterId: string, votedId: string | null, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'voting') throw new Error('Not in voting phase');

    const round = game.rounds[game.currentRound - 1];
    if (round.votes[voterId] !== undefined) throw new Error('Vote already cast');
    if (game.eliminatedPlayerIds.includes(voterId)) throw new Error('Eliminated players cannot vote');

    round.votes[voterId] = votedId;
    await saveGame(game);

    callbacks.emitToRoom('impostor:vote-received', { voterId, votedId });

    const eligibleVoters = game.activePlayerIds.filter((id) => !game.eliminatedPlayerIds.includes(id));
    if (allPlayersVoted(round.votes, eligibleVoters)) {
      clearGameTimer(roomId);
      await this.endVoting(roomId, callbacks);
    }
  },

  async endVoting(roomId: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game || game.status !== 'voting') return;

    const round = game.rounds[game.currentRound - 1];
    const { eliminatedId, wasTie } = countVotes(round.votes);

    round.status = 'revealed';
    game.status = 'reveal';

    if (eliminatedId && !wasTie) {
      round.eliminatedId = eliminatedId;
      if (!game.eliminatedPlayerIds.includes(eliminatedId)) {
        game.eliminatedPlayerIds.push(eliminatedId);
      }
    }

    await saveGame(game);

    callbacks.emitToRoom('impostor:reveal', {
      eliminatedId: eliminatedId ?? null,
      wasImpostor: eliminatedId ? game.impostorIds.includes(eliminatedId) : false,
      impostorIds: game.impostorIds,
      wasTie,
    });

    const result = checkGameOver(game.impostorIds, game.eliminatedPlayerIds, game.activePlayerIds);

    if (result.gameOver) {
      scheduleTimer(roomId, REVEAL_TIME_MS, () => {
        this.finishGame(roomId, result.winnerIds, result.reason, callbacks);
      });
      await setNextAction(roomId, REVEAL_TIME_MS);
    } else {
      scheduleTimer(roomId, REVEAL_TIME_MS, () => {
        this.nextRound(roomId, callbacks);
      });
      await setNextAction(roomId, REVEAL_TIME_MS);
    }
  },

  async nextRound(roomId: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game || game.status === 'finished') return;

    game.currentRound += 1;
    const remainingActive = game.activePlayerIds.filter((id) => !game.eliminatedPlayerIds.includes(id));
    const turnOrder = shuffleTurnOrder(remainingActive);
    const newRound: ImpostorRound = {
      roundNumber: game.currentRound,
      clues: {},
      votes: {},
      status: 'clues',
      turnOrder,
      currentTurnIndex: 0,
    };
    game.rounds.push(newRound);
    game.status = 'playing';
    game.roundTimerEndsAt = Date.now() + ROUND_TIME_MS;
    game.votingTimerEndsAt = undefined;
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    const activePlayers = players.filter(
      (p) => game.activePlayerIds.includes(p.id) && !game.eliminatedPlayerIds.includes(p.id)
    );

    for (const p of activePlayers) {
      const { word: playerWord, theme: playerTheme, isImpostor } = getPlayerWord(
        p.id,
        game.impostorIds,
        game.secretWord,
        game.impostorTheme
      );
      callbacks.emitToPlayer(p.id, 'impostor:round-start', {
        round: game.currentRound,
        timeRemaining: Math.ceil(ROUND_TIME_MS / 1000),
        yourWord: playerWord,
        yourTheme: playerTheme,
        isImpostor,
      });
    }

    const payload = buildGamePayload(game, players);
    callbacks.emitToRoom('impostor:round-start', {
      ...payload,
      turnPlayerId: turnOrder[0],
    });

    scheduleTimer(roomId, ROUND_TIME_MS, () => {
      this.endRoundClues(roomId, callbacks);
    });
    await setNextAction(roomId, ROUND_TIME_MS);
  },

  async finishGame(roomId: string, winnerIds: string[], reason: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) return;

    game.status = 'finished';
    await saveGame(game);

    callbacks.emitToRoom('impostor:game-over', { winnerIds, reason });

    clearGameTimer(roomId);
    // Não deletamos o jogo imediatamente — útil para histórico ou replay
    scheduleTimer(roomId, 300_000, () => {
      deleteGame(roomId);
    });

    // Notificar que o jogo terminou para atualizar a sala
    if (callbacks.onGameFinished) {
      try {
        await callbacks.onGameFinished(roomId);
      } catch (err) {
        console.error('[impostor.finishGame] onGameFinished failed:', err);
      }
    }
  },

  async playerLeft(roomId: string, playerId: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game || game.status === 'finished') return;

    if (!game.activePlayerIds.includes(playerId)) return;
    if (!game.eliminatedPlayerIds.includes(playerId)) {
      game.eliminatedPlayerIds.push(playerId);
    }
    await saveGame(game);

    const players = await callbacks.getRoomPlayers(roomId);
    const remainingActive = game.activePlayerIds.filter((id) => !game.eliminatedPlayerIds.includes(id));

    // Se ficou muito pouco jogador, finalizar jogo
    const result = checkGameOver(game.impostorIds, game.eliminatedPlayerIds, game.activePlayerIds);
    if (result.gameOver) {
      await this.finishGame(roomId, result.winnerIds, result.reason, callbacks);
      return;
    }

    if (game.status === 'playing') {
      const round = game.rounds[game.currentRound - 1];
      if (allPlayersGaveClue(round.clues, remainingActive)) {
        clearGameTimer(roomId);
        await this.endRoundClues(roomId, callbacks);
      }
    } else if (game.status === 'voting') {
      const round = game.rounds[game.currentRound - 1];
      if (allPlayersVoted(round.votes, remainingActive)) {
        clearGameTimer(roomId);
        await this.endVoting(roomId, callbacks);
      }
    }
  },

  async getGameState(roomId: string): Promise<ImpostorGame | null> {
    return getGame(roomId);
  },

  async abandonGame(roomId: string): Promise<void> {
    await deleteGame(roomId);
  },

  async sendCurrentState(roomId: string, playerId: string, callbacks: ImpostorCallbacks): Promise<void> {
    const game = await getGame(roomId);
    if (!game) return;

    const players = await callbacks.getRoomPlayers(roomId);
    const { word: playerWord, theme: playerTheme, isImpostor } = getPlayerWord(
      playerId,
      game.impostorIds,
      game.secretWord,
      game.impostorTheme
    );

    const payload = buildGamePayload(game, players);
    const currentRound = game.rounds[game.currentRound - 1];
    const turnPlayerId = currentRound?.turnOrder[currentRound?.currentTurnIndex ?? 0] ?? undefined;

    callbacks.emitToPlayer(playerId, 'impostor:state', {
      ...payload,
      yourWord: playerWord,
      yourTheme: playerTheme,
      isImpostor,
      turnPlayerId,
    });
  },
};
