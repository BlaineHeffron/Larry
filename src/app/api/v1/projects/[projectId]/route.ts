import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { updateProjectSchema } from "@/lib/validators/project";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
        tasks: {
          include: {
            assigneeAgent: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            agentComments: true,
            humanComments: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/v1/projects/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.ownerAgentId !== agent.id) {
      return NextResponse.json(
        { error: "Forbidden: only the project owner can update this project" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: parsed.data,
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/projects/[projectId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
