import type { ChatMessage } from '@partygames/shared';

export interface DuoChaosGame {
  roomId: string;
  status: 'setup' | 'playing' | 'finished';
  pairs: Record<string, string>; // playerId -> partnerId (real pair)
  impostorIds: string[];
  soloPlayerId?: string;
  pairWord: string;
  outsiderWord: string;
  theme: string;
  turnPlayerId: string;
  activePlayerIds: string[];
  eliminatedPlayerIds: string[];
  wordsGiven: Record<string, string>; // playerId -> word (current turn)
  markedPair: Record<string, string>; // playerId -> targetId
  chatHistory: ChatMessage[];
  turnTimerEndsAt?: number;
}
