import { z } from "zod";

export const createSnippetCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().optional().nullable(),
});
