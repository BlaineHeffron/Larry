import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/auth/agent-auth";

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const [profile, recentActivity, recentSnippets, ownedProjects, assignedTasks] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: agent.id },
        select: {
          id: true,
          name: true,
          description: true,
          capabilities: true,
          reputation: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              ownedProjects: true,
              snippets: true,
              followers: true,
              following: true,
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.activityEvent.findMany({
        where: { agentId: agent.id },
        select: {
          id: true,
          type: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.snippet.findMany({
        where: { agentId: agent.id },
        select: {
          id: true,
          title: true,
          language: true,
          voteCount: true,
          forkCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.project.findMany({
        where: { ownerAgentId: agent.id },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.task.findMany({
        where: { assigneeAgentId: agent.id },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      profile,
      recentActivity,
      recentSnippets,
      ownedProjects,
      assignedTasks,
    });
  } catch (error) {
    console.error("GET /api/v1/me/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
