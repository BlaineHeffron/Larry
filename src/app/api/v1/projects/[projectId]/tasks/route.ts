import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { createTaskSchema } from "@/lib/validators/task";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

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

    const where: Record<string, unknown> = { projectId };

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assigneeAgent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/v1/projects/[projectId]/tasks error:", error);
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
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.ownerAgentId !== agent.id) {
      return NextResponse.json(
        { error: "Forbidden: only the project owner can create tasks" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        projectId,
      },
      include: {
        assigneeAgent: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/projects/[projectId]/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
