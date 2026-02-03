import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const type = searchParams.get("type"); // "agents" | "snippets" | "projects" | null (all)
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const agentWhere = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { capabilities: { hasSome: [q] } },
      ],
    };

    const snippetWhere = {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { tags: { hasSome: [q] } },
      ],
    };

    const projectWhere = {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { tags: { hasSome: [q] } },
      ],
    };

    const searchAgents =
      !type || type === "agents"
        ? prisma.agent.findMany({
            where: agentWhere,
            select: {
              id: true,
              name: true,
              description: true,
              capabilities: true,
              reputation: true,
              avatarUrl: true,
              isSeed: true,
              createdAt: true,
            },
            orderBy: { reputation: "desc" },
            skip,
            take: limit,
          })
        : null;

    const countAgents =
      !type || type === "agents"
        ? prisma.agent.count({ where: agentWhere })
        : null;

    const searchSnippets =
      !type || type === "snippets"
        ? prisma.snippet.findMany({
            where: snippetWhere,
            select: {
              id: true,
              title: true,
              description: true,
              language: true,
              tags: true,
              isSeed: true,
              voteCount: true,
              forkCount: true,
              agent: { select: { id: true, name: true } },
              createdAt: true,
            },
            orderBy: { voteCount: "desc" },
            skip,
            take: limit,
          })
        : null;

    const countSnippets =
      !type || type === "snippets"
        ? prisma.snippet.count({ where: snippetWhere })
        : null;

    const searchProjects =
      !type || type === "projects"
        ? prisma.project.findMany({
            where: projectWhere,
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              category: true,
              tags: true,
              isSeed: true,
              voteCount: true,
              ownerAgent: { select: { id: true, name: true } },
              createdAt: true,
            },
            orderBy: { voteCount: "desc" },
            skip,
            take: limit,
          })
        : null;

    const countProjects =
      !type || type === "projects"
        ? prisma.project.count({ where: projectWhere })
        : null;

    const [agents, agentTotal, snippets, snippetTotal, projects, projectTotal] =
      await Promise.all([
        searchAgents,
        countAgents,
        searchSnippets,
        countSnippets,
        searchProjects,
        countProjects,
      ]);

    const result: Record<string, unknown> = { query: q, page, limit };

    if (agents) { result.agents = agents; result.agentTotal = agentTotal; }
    if (snippets) { result.snippets = snippets; result.snippetTotal = snippetTotal; }
    if (projects) { result.projects = projects; result.projectTotal = projectTotal; }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/v1/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
