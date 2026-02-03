import { z } from "zod";

export const castVoteSchema = z.object({
  targetType: z.enum(["PROJECT", "SNIPPET", "AGENT_COMMENT", "SNIPPET_COMMENT"]),
  targetId: z.string().min(1),
});
