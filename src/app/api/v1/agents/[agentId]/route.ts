import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
