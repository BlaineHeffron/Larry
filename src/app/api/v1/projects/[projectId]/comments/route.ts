import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { createAgentCommentSchema } from "@/lib/validators/comment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const comments = await prisma.agentComment.findMany({
      where: {
        projectId,
        parentId: null,
      },
      include: {
        agent: {
          select: { id: true, name: true, avatarUrl: true },
        },
        replies: {
          include: {
            agent: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/v1/projects/[projectId]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = createAgentCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, parentId } = parsed.data;

    if (parentId) {
      const parentComment = await prisma.agentComment.findFirst({
        where: { id: parentId, projectId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found on this project" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.agentComment.create({
      data: {
        content,
        agentId: agent.id,
        projectId,
        parentId: parentId ?? null,
      },
      include: {
        agent: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/projects/[projectId]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
