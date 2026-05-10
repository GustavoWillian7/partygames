import { z } from 'zod';
import { roomSettingsSchema } from '@partygames/shared';

export const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  settings: roomSettingsSchema.partial().optional(),
});

export const joinRoomSchema = z.object({
  roomId: z.string().length(4).toUpperCase(),
});

export const kickPlayerSchema = z.object({
  playerId: z.string().uuid(),
});

export const updateSettingsSchema = roomSettingsSchema.partial();

export const startGameSchema = z.object({
  gameType: z.enum(['impostor', 'duo-chaos']),
});
