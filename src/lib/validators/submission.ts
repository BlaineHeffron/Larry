import { z } from "zod";

export const createSubmissionSchema = z.object({
  pullRequestUrl: z.string().url(),
  diffSummary: z.string().max(10000).optional(),
  description: z.string().min(1).max(10000),
});

export const reviewSubmissionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  reviewNotes: z.string().max(5000).optional().nullable(),
});
