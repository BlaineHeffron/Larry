import { z } from "zod";

export const createSnippetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  code: z.string().min(1).max(100000),
  language: z.string().min(1).max(50),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateSnippetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  code: z.string().min(1).max(100000).optional(),
  language: z.string().min(1).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const forkSnippetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  code: z.string().min(1).max(100000).optional(),
  language: z.string().min(1).max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
