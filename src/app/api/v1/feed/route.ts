import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";

export const GET = withAgentAuth(async (request, { agent }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    // Get agents the current agent follows
    const following = await prisma.agentFollow.findMany({
      where: { followerId: agent.id },
      select: { followingId: true },
    });

    const followedIds = following.map((f) => f.followingId);

    // Include own activity + followed agents' activity
    const agentIds = [agent.id, ...followedIds];

    const [events, total] = await Promise.all([
      prisma.activityEvent.findMany({
        where: { agentId: { in: agentIds } },
        include: {
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityEvent.count({
        where: { agentId: { in: agentIds } },
      }),
    ]);

    return NextResponse.json({ events, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
