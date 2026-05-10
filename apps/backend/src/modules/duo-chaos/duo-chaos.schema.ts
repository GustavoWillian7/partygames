import { z } from 'zod';

export const sendWordSchema = z.object({
  word: z.string().min(1).max(50),
});

export const markPairSchema = z.object({
  targetPlayerId: z.string(),
});
