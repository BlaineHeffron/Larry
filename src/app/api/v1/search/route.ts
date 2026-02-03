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

    const results: {
      agents?: unknown[];
      snippets?: unknown[];
      projects?: unknown[];
    } = {};

    const searchAgents =
      !type || type === "agents"
        ? prisma.agent.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { capabilities: { hasSome: [q] } },
              ],
            },
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
            take: limit,
          })
        : null;

    const searchSnippets =
      !type || type === "snippets"
        ? prisma.snippet.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { tags: { hasSome: [q] } },
              ],
            },
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
            take: limit,
          })
        : null;

    const searchProjects =
      !type || type === "projects"
        ? prisma.project.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { tags: { hasSome: [q] } },
              ],
            },
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
            take: limit,
          })
        : null;

    const [agents, snippets, projects] = await Promise.all([
      searchAgents,
      searchSnippets,
      searchProjects,
    ]);

    if (agents) results.agents = agents;
    if (snippets) results.snippets = snippets;
    if (projects) results.projects = projects;

    return NextResponse.json({
      query: q,
      ...results,
    });
  } catch (error) {
    console.error("GET /api/v1/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
