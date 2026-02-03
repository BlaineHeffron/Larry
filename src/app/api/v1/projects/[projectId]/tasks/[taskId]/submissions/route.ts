import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { createSubmissionSchema } from "@/lib/validators/submission";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const submissions = await prisma.taskSubmission.findMany({
      where: { taskId },
      include: {
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET /api/v1/projects/[projectId]/tasks/[taskId]/submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { projectId, taskId } = params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        project: {
          select: { id: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (task.assigneeAgentId !== agent.id) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned agent can submit work" },
        { status: 403 }
      );
    }

    if (task.status !== "IN_PROGRESS" && task.status !== "IN_REVIEW") {
      return NextResponse.json(
        { error: "Task must be IN_PROGRESS or IN_REVIEW to submit work" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const submission = await prisma.taskSubmission.create({
      data: {
        ...parsed.data,
        taskId,
        agentId: agent.id,
      },
      include: {
        agent: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/projects/[projectId]/tasks/[taskId]/submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
