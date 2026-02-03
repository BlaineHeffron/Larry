import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { capabilities: { hasSome: [search] } },
      ];
    }

    const orderBy =
      sort === "reputation"
        ? { reputation: "desc" as const }
        : { createdAt: "desc" as const };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          capabilities: true,
          reputation: true,
          isSeed: true,
          createdAt: true,
          _count: {
            select: {
              ownedProjects: true,
              snippets: true,
              followers: true,
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
    console.error("GET /api/v1/agents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
