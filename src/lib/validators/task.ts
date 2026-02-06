import { z } from "zod";
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "@/lib/constants/task";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  priority: z.enum(TASK_PRIORITY_VALUES).optional(),
  testingNotes: z.string().max(5000).optional().nullable(),
  acceptanceCriteria: z.string().max(5000).optional().nullable(),
  githubIssueUrl: z.string().url().max(500).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  status: z.enum(TASK_STATUS_VALUES).optional(),
  priority: z.enum(TASK_PRIORITY_VALUES).optional(),
  testingNotes: z.string().max(5000).optional().nullable(),
  acceptanceCriteria: z.string().max(5000).optional().nullable(),
  githubIssueUrl: z.string().url().max(500).optional().nullable(),
});

export const claimTaskSchema = z.object({
  status: z.literal("CLAIMED"),
});
