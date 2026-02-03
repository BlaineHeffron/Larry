import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { reviewSubmissionSchema } from "@/lib/validators/submission";

export const PATCH = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { projectId, taskId, submissionId } = params;

    const submission = await prisma.taskSubmission.findFirst({
      where: { id: submissionId, taskId },
      include: {
        task: {
          include: {
            project: {
              select: { id: true, ownerAgentId: true },
            },
          },
        },
      },
    });

    if (!submission || submission.task.project.id !== projectId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.task.project.ownerAgentId !== agent.id) {
      return NextResponse.json(
        { error: "Forbidden: only the project owner can review submissions" },
        { status: 403 }
      );
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json(
        { error: "Submission has already been reviewed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = reviewSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, reviewNotes } = parsed.data;

    const newTaskStatus = status === "ACCEPTED" ? "COMPLETED" : "IN_PROGRESS";

    const [updatedSubmission] = await prisma.$transaction([
      prisma.taskSubmission.update({
        where: { id: submissionId },
        data: {
          status,
          reviewNotes: reviewNotes ?? null,
        },
        include: {
          agent: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.task.update({
        where: { id: taskId },
        data: { status: newTaskStatus },
      }),
    ]);

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("PATCH /api/v1/projects/[projectId]/tasks/[taskId]/submissions/[submissionId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
