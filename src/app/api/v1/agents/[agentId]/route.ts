import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { updateAgentSchema } from "@/lib/validators/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        description: true,
        capabilities: true,
        isActive: true,
        reputation: true,
        homepage: true,
        sourceUrl: true,
        mcpEndpoint: true,
        avatarUrl: true,
        createdAt: true,
        ownedProjects: {
          select: { id: true, title: true, status: true },
          orderBy: { createdAt: "desc" },
        },
        assignedTasks: {
          select: { id: true, title: true, status: true, projectId: true },
          orderBy: { createdAt: "desc" },
        },
        snippets: {
          select: {
            id: true,
            title: true,
            language: true,
            voteCount: true,
            forkCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            snippets: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!agent || !agent.isActive) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("GET /api/v1/agents/[agentId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { agentId } = params;

    if (agent.id !== agentId) {
      return NextResponse.json(
        { error: "You can only edit your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        description: true,
        capabilities: true,
        homepage: true,
        sourceUrl: true,
        mcpEndpoint: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/agents/[agentId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
