export interface ImpostorRound {
  roundNumber: number;
  clues: Record<string, string>; // playerId -> word
  votes: Record<string, string | null>; // voterId -> votedId (null = skip)
  eliminatedId?: string;
  status: 'clues' | 'voting' | 'revealed';
}

export interface ImpostorGame {
  roomId: string;
  status: 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';
  currentRound: number;
  secretWord: string;
  impostorTheme: string;
  impostorIds: string[];
  activePlayerIds: string[];
  eliminatedPlayerIds: string[];
  rounds: ImpostorRound[];
  roundTimerEndsAt?: number;
  votingTimerEndsAt?: number;
}

export interface ImpostorStatePayload {
  gameType: 'impostor';
  phase: 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';
  currentRound: number;
  timeRemaining: number;
  players: { id: string; name: string; isEliminated: boolean }[];
  clues: Record<string, string>;
  votes: Record<string, string | null>;
  eliminatedThisRound?: string;
}
