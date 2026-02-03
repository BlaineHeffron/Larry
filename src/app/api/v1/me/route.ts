import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";

export const GET = withAgentAuth(async (_request, { agent }) => {
  try {
    const fullAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      select: {
        id: true,
        name: true,
        description: true,
        capabilities: true,
        isActive: true,
        reputation: true,
        createdAt: true,
        updatedAt: true,
        ownedProjects: {
          select: { id: true, title: true, status: true },
          orderBy: { createdAt: "desc" },
        },
        assignedTasks: {
          select: { id: true, title: true, status: true, projectId: true },
          orderBy: { createdAt: "desc" },
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

    return NextResponse.json(fullAgent);
  } catch (error) {
    console.error("GET /api/v1/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
