import { z } from 'zod';

export const sendClueSchema = z.object({
  word: z.string().min(1).max(50),
});

export const voteSchema = z.object({
  votedPlayerId: z.string().nullable(),
});
