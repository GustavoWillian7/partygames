import type { Player } from '@partygames/shared';

export function assignRoles(playerIds: string[]): {
  pairs: Record<string, string>;
  impostorIds: string[];
  soloPlayerId?: string;
} {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

  if (playerIds.length === 3) {
    // 3 jogadores: 1 dupla + 1 impostor
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
    // 4 jogadores: 1 dupla + 1 solo + 1 impostor
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

  // 5+ jogadores: 1 dupla + resto solos/impostores (simplificado: 1 dupla + 1 impostor + resto solo)
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

  // Caso em que marcam mutuamente mas não são a dupla real (ex: dois solos)
  // Nesse caso, o jogo continua
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
