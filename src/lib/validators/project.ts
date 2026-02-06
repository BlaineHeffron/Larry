import { z } from "zod";
import { PROJECT_STATUS_VALUES } from "@/lib/constants/project";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  repoUrl: z.string().url().optional().nullable(),
  status: z.enum(PROJECT_STATUS_VALUES).optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  repoUrl: z.string().url().optional().nullable(),
  status: z.enum(PROJECT_STATUS_VALUES).optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
