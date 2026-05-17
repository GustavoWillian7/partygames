import type { Player } from '@partygames/shared';
import { getThemeGroup } from '../../data/themeGroups';

export interface WordSet {
  pairWord: string;
  outsiderWord: string;
  theme: string;
}

export function pickWords(count: number, themeGroupId?: string): WordSet[] {
  const group = getThemeGroup(themeGroupId ?? 'all');
  const entries = group?.entries.length ? group.entries : getThemeGroup('all')!.entries;
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map((e) => e.duoChaos);
}

export function getPlayerWord(
  playerId: string,
  pairs: Record<string, string>,
  impostorIds: string[],
  playerWords: Record<string, string>
): string {
  return playerWords[playerId] ?? '???';
}

export function assignRoles(playerIds: string[]): {
  pairs: Record<string, string>;
  impostorIds: string[];
  pairCount: number;
} {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const n = playerIds.length;

  let pairCount: number;
  let impostorCount: number;

  if (n % 2 === 1) {
    // Ímpar: (n-1)/2 duplas + 1 impostor
    pairCount = Math.floor(n / 2);
    impostorCount = 1;
  } else {
    // Par: n/2 - 1 duplas + 2 impostores
    pairCount = n / 2 - 1;
    impostorCount = 2;
  }

  const pairs: Record<string, string> = {};
  let idx = 0;
  for (let i = 0; i < pairCount; i++) {
    const a = shuffled[idx++];
    const b = shuffled[idx++];
    pairs[a] = b;
    pairs[b] = a;
  }

  const impostorIds = shuffled.slice(idx, idx + impostorCount);

  return { pairs, impostorIds, pairCount };
}

export function buildPlayerWords(
  pairs: Record<string, string>,
  impostorIds: string[],
  wordSets: WordSet[]
): { playerWords: Record<string, string>; theme: string } {
  const playerWords: Record<string, string> = {};
  const pairPlayers = Object.keys(pairs);
  const themes = new Set<string>();

  // Distribuir palavras para duplas
  let wordSetIdx = 0;
  const usedPairs = new Set<string>();
  for (const [a, b] of Object.entries(pairs)) {
    if (usedPairs.has(a)) continue;
    usedPairs.add(a);
    usedPairs.add(b);
    const ws = wordSets[wordSetIdx++];
    playerWords[a] = ws.pairWord;
    playerWords[b] = ws.pairWord;
    themes.add(ws.theme);
  }

  // Distribuir palavras para impostores (usam outsiderWord de uma das entradas sorteadas)
  const impostorWordSet = wordSets[Math.floor(Math.random() * wordSets.length)];
  for (const id of impostorIds) {
    playerWords[id] = impostorWordSet.outsiderWord;
  }
  themes.add(impostorWordSet.theme);

  return { playerWords, theme: Array.from(themes).join(' / ') };
}

export function getNextTurnPlayer(
  currentTurnId: string,
  activePlayerIds: string[]
): string {
  const idx = activePlayerIds.indexOf(currentTurnId);
  return activePlayerIds[(idx + 1) % activePlayerIds.length];
}

export function checkMutualMark(
  markedPair: Record<string, string>
): { mutual: boolean; a?: string; b?: string } {
  for (const [a, b] of Object.entries(markedPair)) {
    if (markedPair[b] === a) {
      return { mutual: true, a, b };
    }
  }
  return { mutual: false };
}

export function checkGameOver(
  mutualA: string,
  mutualB: string,
  pairs: Record<string, string>,
  impostorIds: string[]
): { gameOver: boolean; winnerIds: string[]; reason: string } {
  const aIsImpostor = impostorIds.includes(mutualA);
  const bIsImpostor = impostorIds.includes(mutualB);

  if (aIsImpostor || bIsImpostor) {
    return {
      gameOver: true,
      winnerIds: impostorIds,
      reason: 'O impostor enganou e foi marcado como dupla!',
    };
  }

  const aIsPair = pairs[mutualA] === mutualB;
  const bIsPair = pairs[mutualB] === mutualA;

  if (aIsPair && bIsPair) {
    const winnerIds = Object.entries(pairs)
      .filter(([k]) => !impostorIds.includes(k))
      .map(([k]) => k);
    return {
      gameOver: true,
      winnerIds,
      reason: 'A dupla real se encontrou!',
    };
  }

  return { gameOver: false, winnerIds: [], reason: '' };
}

export function buildGamePayload(
  game: {
    status: 'setup' | 'playing' | 'finished';
    turnPlayerId: string;
    turnTimerEndsAt?: number;
    activePlayerIds: string[];
    eliminatedPlayerIds: string[];
    wordsGiven: Record<string, string>;
    chatHistory: { playerId: string; word: string; timestamp: Date }[];
  },
  roomPlayers: Player[]
) {
  return {
    gameType: 'duo-chaos' as const,
    phase: game.status === 'finished' ? 'finished' : 'playing',
    turnPlayerId: game.turnPlayerId,
    timeRemaining: game.turnTimerEndsAt
      ? Math.max(0, Math.ceil((game.turnTimerEndsAt - Date.now()) / 1000))
      : 0,
    players: roomPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      isEliminated: game.eliminatedPlayerIds.includes(p.id),
    })),
    wordsGiven: game.wordsGiven,
    chatHistory: game.chatHistory.slice(-20),
  };
}
