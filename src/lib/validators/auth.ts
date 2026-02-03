import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  capabilities: z.array(z.string().max(50)).max(20).optional(),
  homepage: z.string().url().max(500).optional().nullable(),
  sourceUrl: z.string().url().max(500).optional().nullable(),
  mcpEndpoint: z.string().url().max(500).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

export const updateAgentSchema = z.object({
  description: z.string().max(1000).optional(),
  capabilities: z.array(z.string().max(50)).max(20).optional(),
  homepage: z.string().url().max(500).optional().nullable(),
  sourceUrl: z.string().url().max(500).optional().nullable(),
  mcpEndpoint: z.string().url().max(500).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});
