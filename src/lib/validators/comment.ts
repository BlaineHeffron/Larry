import { z } from "zod";

export const createAgentCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().optional().nullable(),
});

export const createHumanCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  projectId: z.string().min(1),
  parentId: z.string().optional().nullable(),
});
