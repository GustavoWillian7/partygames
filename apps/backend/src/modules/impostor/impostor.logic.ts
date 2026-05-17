import type { Player } from '@partygames/shared';
import { getThemeGroup } from '../../data/themeGroups';

export function pickWord(themeGroupId?: string): { word: string; theme: string } {
  const group = getThemeGroup(themeGroupId ?? 'all');
  const entries = group?.entries.length ? group.entries : getThemeGroup('all')!.entries;
  const entry = entries[Math.floor(Math.random() * entries.length)];
  return entry.impostor;
}

export function assignImpostors(
  playerIds: string[],
  count: number
): string[] {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Math.min(count, playerIds.length - 1)));
}

export function countVotes(
  votes: Record<string, string | null>
): { eliminatedId: string | null; wasTie: boolean } {
  const counts: Record<string, number> = {};
  let totalVotes = 0;

  for (const votedId of Object.values(votes)) {
    if (votedId) {
      counts[votedId] = (counts[votedId] || 0) + 1;
      totalVotes++;
    }
  }

  if (totalVotes === 0) {
    return { eliminatedId: null, wasTie: false };
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topId, topCount] = sorted[0];

  if (sorted.length > 1 && sorted[1][1] === topCount) {
    return { eliminatedId: null, wasTie: true };
  }

  return { eliminatedId: topId, wasTie: false };
}

export function checkGameOver(
  impostorIds: string[],
  eliminatedIds: string[],
  activePlayerIds: string[]
): { gameOver: boolean; winnerIds: string[]; reason: string } {
  const remainingImpostors = impostorIds.filter(
    (id) => !eliminatedIds.includes(id)
  );
  const remainingInnocents = activePlayerIds.filter(
    (id) => !impostorIds.includes(id) && !eliminatedIds.includes(id)
  );

  if (remainingImpostors.length === 0) {
    return {
      gameOver: true,
      winnerIds: remainingInnocents,
      reason: 'Todos os impostores foram eliminados!',
    };
  }

  if (remainingInnocents.length <= remainingImpostors.length) {
    return {
      gameOver: true,
      winnerIds: remainingImpostors,
      reason: 'Os impostores dominaram a sala!',
    };
  }

  return { gameOver: false, winnerIds: [], reason: '' };
}

export function getPlayerWord(
  playerId: string,
  impostorIds: string[],
  secretWord: string,
  impostorTheme: string
): { word?: string; theme?: string; isImpostor: boolean } {
  if (impostorIds.includes(playerId)) {
    return { theme: impostorTheme, isImpostor: true };
  }
  return { word: secretWord, theme: impostorTheme, isImpostor: false };
}

export function allPlayersGaveClue(
  clues: Record<string, string>,
  activePlayerIds: string[]
): boolean {
  return activePlayerIds.every((id) => clues[id] !== undefined);
}

export function allPlayersVoted(
  votes: Record<string, string | null>,
  activePlayerIds: string[]
): boolean {
  return activePlayerIds.every((id) => votes[id] !== undefined);
}

export function buildGamePayload(
  game: {
    status: 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';
    currentRound: number;
    secretWord: string;
    impostorTheme: string;
    impostorIds: string[];
    activePlayerIds: string[];
    eliminatedPlayerIds: string[];
    rounds: { roundNumber: number; clues: Record<string, string>; votes: Record<string, string | null>; eliminatedId?: string; status: string }[];
    roundTimerEndsAt?: number;
    votingTimerEndsAt?: number;
  },
  roomPlayers: Player[]
) {
  const currentRound = game.rounds[game.currentRound - 1];
  return {
    gameType: 'impostor' as const,
    phase: game.status,
    currentRound: game.currentRound,
    timeRemaining: game.status === 'playing' && game.roundTimerEndsAt
      ? Math.max(0, Math.ceil((game.roundTimerEndsAt - Date.now()) / 1000))
      : game.status === 'voting' && game.votingTimerEndsAt
        ? Math.max(0, Math.ceil((game.votingTimerEndsAt - Date.now()) / 1000))
        : 0,
    players: roomPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      isEliminated: game.eliminatedPlayerIds.includes(p.id),
    })),
    clues: currentRound?.clues ?? {},
    votes: currentRound?.votes ?? {},
    eliminatedThisRound: currentRound?.eliminatedId,
  };
}
