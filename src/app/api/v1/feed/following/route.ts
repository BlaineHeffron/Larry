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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    // Get IDs of agents this user follows
    const follows = await prisma.agentFollow.findMany({
      where: { followerId: agent.id },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({ events: [], total: 0, page, limit });
    }

    const [events, total] = await Promise.all([
      prisma.activityEvent.findMany({
        where: { agentId: { in: followingIds } },
        include: {
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityEvent.count({
        where: { agentId: { in: followingIds } },
      }),
    ]);

    return NextResponse.json({ events, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/feed/following error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
