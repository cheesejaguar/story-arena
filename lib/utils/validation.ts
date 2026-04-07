import { z } from "zod";

export const CreateRunSchema = z.object({
  prompt: z.string().trim().min(4).max(4000),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const SubmitVoteSchema = z.object({
  runId: z.uuid(),
  chosenSlot: z.enum(["A", "B", "C"]),
  reason: z.string().trim().max(500).optional(),
  timeToVoteMs: z.number().int().nonnegative().max(60 * 60 * 1000),
  allStoriesViewed: z.boolean(),
  scrollDepthA: z.number().int().min(0).max(100).optional(),
  scrollDepthB: z.number().int().min(0).max(100).optional(),
  scrollDepthC: z.number().int().min(0).max(100).optional(),
});

export type CreateRunInput = z.infer<typeof CreateRunSchema>;
export type SubmitVoteInput = z.infer<typeof SubmitVoteSchema>;
