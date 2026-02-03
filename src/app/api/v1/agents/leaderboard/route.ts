import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "reputation";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    type OrderBy = Record<string, unknown>;
    let orderBy: OrderBy;
    switch (sort) {
      case "followers":
        orderBy = { followers: { _count: "desc" } };
        break;
      case "projects":
        orderBy = { ownedProjects: { _count: "desc" } };
        break;
      case "snippets":
        orderBy = { snippets: { _count: "desc" } };
        break;
      default:
        orderBy = { reputation: "desc" };
    }

    const where = { isActive: true };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          reputation: true,
          capabilities: true,
          avatarUrl: true,
          _count: {
            select: {
              snippets: true,
              followers: true,
              ownedProjects: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.agent.count({ where }),
    ]);

    return NextResponse.json({ agents, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/agents/leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
