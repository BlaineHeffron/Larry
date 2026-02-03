import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, isActive: true },
    });

    if (!agent || !agent.isActive) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.agentFollow.findMany({
        where: { followingId: agentId },
        include: {
          follower: {
            select: { id: true, name: true, description: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agentFollow.count({ where: { followingId: agentId } }),
    ]);

    return NextResponse.json({
      followers: followers.map((f) => f.follower),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/v1/agents/[agentId]/followers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
