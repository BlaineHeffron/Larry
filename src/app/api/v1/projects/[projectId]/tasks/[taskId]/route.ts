import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { updateTaskSchema } from "@/lib/validators/task";
import type { Agent } from "@prisma/client";

type TaskWithProject = {
  id: string;
  status: string;
  projectId: string;
  assigneeAgentId: string | null;
  project: {
    id: string;
    title: string;
    ownerAgentId: string;
  };
};

function validateStatusTransition(
  task: TaskWithProject,
  newStatus: string,
  agent: Agent
): string | null {
  const isOwner = task.project.ownerAgentId === agent.id;
  const isAssignee = task.assigneeAgentId === agent.id;
  const currentStatus = task.status;

  if (newStatus === "CANCELLED") {
    if (!isOwner) {
      return "Only the project owner can cancel tasks";
    }
    return null;
  }

  switch (`${currentStatus}->${newStatus}`) {
    case "POSTED->CLAIMED":
      if (isOwner) {
        return "The project owner cannot claim their own tasks";
      }
      return null;

    case "CLAIMED->IN_PROGRESS":
      if (!isAssignee) {
        return "Only the assigned agent can move the task to in-progress";
      }
      return null;

    case "IN_PROGRESS->IN_REVIEW":
      if (!isAssignee) {
        return "Only the assigned agent can submit the task for review";
      }
      return null;

    case "IN_REVIEW->COMPLETED":
      if (!isOwner) {
        return "Only the project owner can mark the task as completed";
      }
      return null;

    case "IN_REVIEW->IN_PROGRESS":
      if (!isOwner) {
        return "Only the project owner can send the task back for rework";
      }
      return null;

    default:
      return `Invalid status transition from ${currentStatus} to ${newStatus}`;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assigneeAgent: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, title: true, ownerAgentId: true },
        },
        submissions: {
          orderBy: { createdAt: "desc" },
        },
        agentComments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("GET /api/v1/projects/[projectId]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { projectId, taskId } = params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        project: {
          select: { id: true, title: true, ownerAgentId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status: newStatus, title, description, priority, testingNotes, acceptanceCriteria, githubIssueUrl } = parsed.data;
    const isOwner = task.project.ownerAgentId === agent.id;

    // Handle field updates on POSTED tasks (owner only)
    const fieldUpdates: Record<string, unknown> = {};

    if (title !== undefined || description !== undefined || priority !== undefined || testingNotes !== undefined || acceptanceCriteria !== undefined || githubIssueUrl !== undefined) {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden: only the project owner can update task fields" },
          { status: 403 }
        );
      }

      if (task.status !== "POSTED") {
        return NextResponse.json(
          { error: "Task fields can only be updated while the task is in POSTED status" },
          { status: 400 }
        );
      }

      if (title !== undefined) fieldUpdates.title = title;
      if (description !== undefined) fieldUpdates.description = description;
      if (priority !== undefined) fieldUpdates.priority = priority;
      if (testingNotes !== undefined) fieldUpdates.testingNotes = testingNotes;
      if (acceptanceCriteria !== undefined) fieldUpdates.acceptanceCriteria = acceptanceCriteria;
      if (githubIssueUrl !== undefined) fieldUpdates.githubIssueUrl = githubIssueUrl;
    }

    // Handle status transition
    if (newStatus) {
      const error = validateStatusTransition(task, newStatus, agent);
      if (error) {
        return NextResponse.json(
          { error: `Forbidden: ${error}` },
          { status: 403 }
        );
      }

      fieldUpdates.status = newStatus;

      // Set assignee when claiming
      if (newStatus === "CLAIMED") {
        fieldUpdates.assigneeAgentId = agent.id;
      }
    }

    if (Object.keys(fieldUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: fieldUpdates,
      include: {
        assigneeAgent: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, title: true, ownerAgentId: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/projects/[projectId]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
