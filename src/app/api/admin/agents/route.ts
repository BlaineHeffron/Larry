import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/human-auth";
import { generateApiKey } from "@/lib/auth/agent-auth";
import { createAgentSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        capabilities: true,
        apiKeyPrefix: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("List agents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

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

    return NextResponse.json(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities,
          apiKeyPrefix: agent.apiKeyPrefix,
        },
        apiKey: apiKey.raw, // Only returned once at creation
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create agent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
