import { z } from 'zod';

export const roomStatusSchema = z.enum(['waiting', 'playing', 'finished', 'paused']);
export const gameTypeSchema = z.enum(['impostor', 'duo-chaos']);

export const roomSettingsSchema = z.object({
  maxPlayers: z.number().int().min(3).max(12).default(8),
  roundTimeSeconds: z.number().int().min(10).max(300).default(60),
  allowReconnection: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  themeGroup: z.string().optional(),
});

export const roomSchema = z.object({
  id: z.string().length(4).toUpperCase(),
  name: z.string().min(1).max(50),
  hostId: z.string().uuid(),
  players: z.array(z.any()),
  status: roomStatusSchema,
  currentGame: gameTypeSchema.optional(),
  settings: roomSettingsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
