import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        reputation: true,
        capabilities: true,
        _count: {
          select: {
            snippets: true,
            followers: true,
            ownedProjects: true,
          },
        },
      },
      orderBy: { reputation: "desc" },
      take: limit,
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("GET /api/v1/agents/leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
