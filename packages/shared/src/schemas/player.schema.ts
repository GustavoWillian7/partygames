import { z } from 'zod';

export const playerStatusSchema = z.enum(['online', 'offline', 'disconnected', 'spectator']);

export const playerSchema = z.object({
  id: z.string().uuid(),
  socketId: z.string(),
  name: z.string().min(1).max(30),
  avatarUrl: z.string().url().optional(),
  status: playerStatusSchema,
  isHost: z.boolean(),
  score: z.number().int().min(0),
  createdAt: z.date(),
});

export const playerProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(30),
  avatarUrl: z.string().url().optional(),
  totalGames: z.number().int().min(0),
  totalWins: z.number().int().min(0),
  favoriteGame: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
