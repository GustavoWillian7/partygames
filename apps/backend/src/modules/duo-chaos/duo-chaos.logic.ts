import type { Player } from '@partygames/shared';

const WORD_BANK: { pairWord: string; outsiderWord: string; theme: string }[] = [
  { pairWord: 'Cachorro', outsiderWord: 'Gato', theme: 'Animais domésticos' },
  { pairWord: 'Messi', outsiderWord: 'CR7', theme: 'Jogadores de futebol' },
  { pairWord: 'Pizza', outsiderWord: 'Lasanha', theme: 'Comidas italianas' },
  { pairWord: 'Leão', outsiderWord: 'Tigre', theme: 'Felinos' },
  { pairWord: 'Guitarra', outsiderWord: 'Violão', theme: 'Instrumentos de corda' },
  { pairWord: 'Nike', outsiderWord: 'Adidas', theme: 'Marcas de roupa' },
  { pairWord: 'Titanic', outsiderWord: 'Avatar', theme: 'Filmes famosos' },
  { pairWord: 'Tênis', outsiderWord: 'Futebol', theme: 'Esportes' },
  { pairWord: 'Brasil', outsiderWord: 'Argentina', theme: 'Países da América do Sul' },
  { pairWord: 'Café', outsiderWord: 'Chá', theme: 'Bebidas quentes' },
  { pairWord: 'Bicicleta', outsiderWord: 'Moto', theme: 'Meios de transporte' },
  { pairWord: 'Harry Potter', outsiderWord: 'Senhor dos Anéis', theme: 'Livros famosos' },
  { pairWord: 'Verão', outsiderWord: 'Inverno', theme: 'Estações do ano' },
  { pairWord: 'Piano', outsiderWord: 'Órgão', theme: 'Instrumentos de teclas' },
  { pairWord: 'Montanha', outsiderWord: 'Praia', theme: 'Lugares para viajar' },
  { pairWord: 'Superman', outsiderWord: 'Batman', theme: 'Heróis da DC Comics' },
];

export function pickWords(): { pairWord: string; outsiderWord: string; theme: string } {
  return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
}

export function getPlayerWord(
  playerId: string,
  pairs: Record<string, string>,
  impostorIds: string[],
  _soloPlayerId: string | undefined,
  pairWord: string,
  outsiderWord: string
): string {
  // A dupla recebe a palavra da dupla
  if (pairs[playerId] !== undefined) return pairWord;
  // Impostor e solo recebem a palavra "de fora" (a mesma para ambos)
  return outsiderWord;
}

export function assignRoles(playerIds: string[]): {
  pairs: Record<string, string>;
  impostorIds: string[];
  soloPlayerId?: string;
} {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

  if (playerIds.length === 3) {
    const pairA = shuffled[0];
    const pairB = shuffled[1];
    const impostor = shuffled[2];
    return {
      pairs: { [pairA]: pairB, [pairB]: pairA },
      impostorIds: [impostor],
      soloPlayerId: undefined,
    };
  }

  if (playerIds.length === 4) {
    const pairA = shuffled[0];
    const pairB = shuffled[1];
    const solo = shuffled[2];
    const impostor = shuffled[3];
    return {
      pairs: { [pairA]: pairB, [pairB]: pairA },
      impostorIds: [impostor],
      soloPlayerId: solo,
    };
  }

  const pairA = shuffled[0];
  const pairB = shuffled[1];
  const impostor = shuffled[2];
  return {
    pairs: { [pairA]: pairB, [pairB]: pairA },
    impostorIds: [impostor],
    soloPlayerId: shuffled[3],
  };
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
