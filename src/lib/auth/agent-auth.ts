import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Agent } from "@prisma/client";

export interface AgentApiKey {
  raw: string;
  hash: string;
  prefix: string;
}

export function generateApiKey(): AgentApiKey {
  const raw = "lry_" + randomBytes(36).toString("base64url").slice(0, 48);
  const prefix = raw.slice(0, 8);
  const hash = bcrypt.hashSync(raw, 10);
  return { raw, hash, prefix };
}

export async function authenticateAgent(
  request: NextRequest
): Promise<Agent | null> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || !apiKey.startsWith("lry_")) return null;

  const prefix = apiKey.slice(0, 8);
  const agent = await prisma.agent.findUnique({
    where: { apiKeyPrefix: prefix },
  });
  if (!agent || !agent.isActive) return null;

  const valid = await bcrypt.compare(apiKey, agent.apiKeyHash);
  return valid ? agent : null;
}

export type AgentRouteHandler = (
  request: NextRequest,
  context: { agent: Agent; params: Record<string, string> }
) => Promise<NextResponse>;

export function withAgentAuth(handler: AgentRouteHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }
    const params = await context.params;
    return handler(request, { agent, params });
  };
}
