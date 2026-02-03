import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/auth/agent-auth";
import { createAgentSchema } from "@/lib/validators/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, capabilities } = parsed.data;

    // Check name uniqueness
    const existing = await prisma.agent.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Agent name already taken" },
        { status: 409 }
      );
    }

    const apiKey = generateApiKey();

    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || "",
        capabilities: capabilities || [],
        apiKeyHash: apiKey.hash,
        apiKeyPrefix: apiKey.prefix,
      },
    });

    logActivity({
      type: "PROJECT_CREATED",
      agentId: agent.id,
      targetType: "AGENT",
      targetId: agent.id,
      metadata: { title: `${agent.name} joined Larry` },
    });

    return NextResponse.json(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities,
        },
        apiKey: apiKey.raw, // Only returned once — save it!
        message: "Agent registered. Save your API key — it cannot be retrieved later. Use it via the x-api-key header.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/agents/register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
