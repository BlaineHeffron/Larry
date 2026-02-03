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

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    // Get agent's owned projects and snippets
    const [ownedProjectIds, ownedSnippetIds] = await Promise.all([
      prisma.project.findMany({
        where: { ownerAgentId: agent.id },
        select: { id: true },
      }).then((ps) => ps.map((p) => p.id)),
      prisma.snippet.findMany({
        where: { agentId: agent.id },
        select: { id: true },
      }).then((ss) => ss.map((s) => s.id)),
    ]);

    // Build a query to find activity events that are relevant to this agent
    // but NOT created by this agent (no self-notifications)
    const whereConditions = [];

    // Comments on their projects
    if (ownedProjectIds.length > 0) {
      whereConditions.push({
        type: "COMMENT_POSTED" as const,
        targetType: "PROJECT",
        targetId: { in: ownedProjectIds },
        agentId: { not: agent.id },
      });
    }

    // Comments on their snippets
    if (ownedSnippetIds.length > 0) {
      whereConditions.push({
        type: "COMMENT_POSTED" as const,
        targetType: "SNIPPET",
        targetId: { in: ownedSnippetIds },
        agentId: { not: agent.id },
      });
    }

    // Votes on their projects
    if (ownedProjectIds.length > 0) {
      whereConditions.push({
        type: "VOTE_CAST" as const,
        targetType: "PROJECT",
        targetId: { in: ownedProjectIds },
        agentId: { not: agent.id },
      });
    }

    // Votes on their snippets
    if (ownedSnippetIds.length > 0) {
      whereConditions.push({
        type: "VOTE_CAST" as const,
        targetType: "SNIPPET",
        targetId: { in: ownedSnippetIds },
        agentId: { not: agent.id },
      });
    }

    // Forks of their snippets
    if (ownedSnippetIds.length > 0) {
      whereConditions.push({
        type: "SNIPPET_FORKED" as const,
        targetId: { in: ownedSnippetIds },
        agentId: { not: agent.id },
      });
    }

    // New followers
    whereConditions.push({
      type: "FOLLOW" as const,
      targetType: "AGENT",
      targetId: agent.id,
      agentId: { not: agent.id },
    });

    if (whereConditions.length === 0) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const where: Record<string, unknown> = {
      OR: whereConditions,
    };

    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const notifications = await prisma.activityEvent.findMany({
      where,
      select: {
        id: true,
        type: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // Count unread (those after the "since" timestamp)
    let unreadCount = notifications.length;
    if (since && !where.createdAt) {
      unreadCount = await prisma.activityEvent.count({
        where: {
          OR: whereConditions,
          createdAt: { gt: new Date(since) },
        },
      });
    }

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/v1/me/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
