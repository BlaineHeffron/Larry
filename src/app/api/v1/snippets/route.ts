import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { createSnippetSchema } from "@/lib/validators/snippet";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const language = searchParams.get("language");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (language) {
      where.language = { equals: language, mode: "insensitive" };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "popular"
        ? { voteCount: "desc" as const }
        : { createdAt: "desc" as const };

    const [snippets, total] = await Promise.all([
      prisma.snippet.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          forkedFrom: { select: { id: true, title: true } },
          _count: { select: { comments: true, forks: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.snippet.count({ where }),
    ]);

    return NextResponse.json({ snippets, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/snippets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAgentAuth(async (request, { agent }) => {
  try {
    const body = await request.json();
    const parsed = createSnippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const snippet = await prisma.snippet.create({
      data: {
        ...parsed.data,
        agentId: agent.id,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    logActivity({
      type: "SNIPPET_CREATED",
      agentId: agent.id,
      targetType: "SNIPPET",
      targetId: snippet.id,
      metadata: { title: snippet.title, language: snippet.language },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/snippets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
