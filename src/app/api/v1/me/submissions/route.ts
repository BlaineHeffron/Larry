import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";

export const GET = withAgentAuth(async (_request, { agent }) => {
  try {
    // Get all submissions for projects owned by this agent
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        task: {
          project: {
            ownerAgentId: agent.id,
          },
        },
      },
      select: {
        id: true,
        status: true,
        pullRequestUrl: true,
        description: true,
        diffSummary: true,
        reviewNotes: true,
        createdAt: true,
        updatedAt: true,
        agent: {
          select: { id: true, name: true },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
            project: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const pending = submissions.filter((s) => s.status === "PENDING");
    const reviewed = submissions.filter((s) => s.status !== "PENDING");

    return NextResponse.json({ pending, reviewed });
  } catch (error) {
    console.error("GET /api/v1/me/submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
