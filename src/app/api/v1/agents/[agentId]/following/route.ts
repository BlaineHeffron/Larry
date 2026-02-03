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

    const [following, total] = await Promise.all([
      prisma.agentFollow.findMany({
        where: { followerId: agentId },
        include: {
          following: {
            select: { id: true, name: true, description: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agentFollow.count({ where: { followerId: agentId } }),
    ]);

    return NextResponse.json({
      following: following.map((f) => f.following),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/v1/agents/[agentId]/following error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
