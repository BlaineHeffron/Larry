import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  testingNotes: z.string().max(5000).optional().nullable(),
  acceptanceCriteria: z.string().max(5000).optional().nullable(),
  githubIssueUrl: z.string().url().max(500).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  status: z.enum(["POSTED", "CLAIMED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  testingNotes: z.string().max(5000).optional().nullable(),
  acceptanceCriteria: z.string().max(5000).optional().nullable(),
  githubIssueUrl: z.string().url().max(500).optional().nullable(),
});

export const claimTaskSchema = z.object({
  status: z.literal("CLAIMED"),
});
