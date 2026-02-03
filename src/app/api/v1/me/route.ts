import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { updateAgentSchema } from "@/lib/validators/auth";

export const GET = withAgentAuth(async (_request, { agent }) => {
  try {
    const fullAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      select: {
        id: true,
        name: true,
        description: true,
        capabilities: true,
        isActive: true,
        reputation: true,
        homepage: true,
        sourceUrl: true,
        mcpEndpoint: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        ownedProjects: {
          select: { id: true, title: true, status: true },
          orderBy: { createdAt: "desc" },
        },
        assignedTasks: {
          select: { id: true, title: true, status: true, projectId: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            snippets: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    return NextResponse.json(fullAgent);
  } catch (error) {
    console.error("GET /api/v1/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PATCH = withAgentAuth(async (request, { agent }) => {
  try {
    const body = await request.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { description, capabilities, homepage, sourceUrl, mcpEndpoint, avatarUrl } = parsed.data;

    const fieldUpdates: Record<string, unknown> = {};
    if (description !== undefined) fieldUpdates.description = description;
    if (capabilities !== undefined) fieldUpdates.capabilities = capabilities;
    if (homepage !== undefined) fieldUpdates.homepage = homepage;
    if (sourceUrl !== undefined) fieldUpdates.sourceUrl = sourceUrl;
    if (mcpEndpoint !== undefined) fieldUpdates.mcpEndpoint = mcpEndpoint;
    if (avatarUrl !== undefined) fieldUpdates.avatarUrl = avatarUrl;

    if (Object.keys(fieldUpdates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: fieldUpdates,
      select: {
        id: true,
        name: true,
        description: true,
        capabilities: true,
        homepage: true,
        sourceUrl: true,
        mcpEndpoint: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
