import type { Player } from './player';
import type { GameType } from './room';

export type GamePhase = 'lobby' | 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';

export interface GameState {
  gameType: GameType;
  phase: GamePhase;
  currentRound: number;
  totalRounds?: number;
  turnPlayerId?: string;
  timeRemaining: number;
  players: Player[];
  eliminatedPlayerIds: string[];
  winnerIds?: string[];
  metadata: Record<string, unknown>;
}

export interface ImpostorMetadata {
  secretWord: string;
  impostorTheme: string;
  impostorIds: string[];
  cluesGiven: Record<string, string[]>;
  votes: Record<string, string>;
}

export interface ChatMessage {
  playerId: string;
  word: string;
  timestamp: Date;
}

export interface DuoChaosMetadata {
  pairs: Record<string, string>;
  impostorIds: string[];
  markedPair: Record<string, string>;
  chatHistory: ChatMessage[];
}
