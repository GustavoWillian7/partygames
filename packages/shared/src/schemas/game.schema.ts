import { z } from 'zod';
import { gameTypeSchema } from './room.schema';

export const gamePhaseSchema = z.enum(['lobby', 'setup', 'playing', 'voting', 'reveal', 'finished']);

export const gameStateSchema = z.object({
  gameType: gameTypeSchema,
  phase: gamePhaseSchema,
  currentRound: z.number().int().min(0),
  totalRounds: z.number().int().min(1).optional(),
  turnPlayerId: z.string().uuid().optional(),
  timeRemaining: z.number().int().min(0),
  players: z.array(z.any()),
  eliminatedPlayerIds: z.array(z.string().uuid()),
  winnerIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()),
});

export const chatMessageSchema = z.object({
  playerId: z.string().uuid(),
  word: z.string().min(1).max(50),
  timestamp: z.date(),
});

export const impostorMetadataSchema = z.object({
  secretWord: z.string(),
  impostorTheme: z.string(),
  impostorIds: z.array(z.string().uuid()),
  cluesGiven: z.record(z.array(z.string())),
  votes: z.record(z.string().uuid().or(z.literal('null'))),
});

export const duoChaosMetadataSchema = z.object({
  pairs: z.record(z.string().uuid()),
  impostorIds: z.array(z.string().uuid()),
  markedPair: z.record(z.string().uuid()),
  chatHistory: z.array(chatMessageSchema),
});
