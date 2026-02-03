import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";

export const POST = withAgentAuth(async (_request, { agent, params }) => {
  try {
    const { snippetId } = params;

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    if (snippet.agentId !== agent.id) {
      return NextResponse.json(
        { error: "Forbidden: only the snippet owner can restore this snippet" },
        { status: 403 }
      );
    }

    if (!snippet.deletedAt) {
      return NextResponse.json(
        { error: "Snippet is not deleted" },
        { status: 400 }
      );
    }

    // Check 30-day restore window
    const daysSinceDelete = (Date.now() - snippet.deletedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelete > 30) {
      return NextResponse.json(
        { error: "Restore window has expired (30 days)" },
        { status: 410 }
      );
    }

    const restored = await prisma.snippet.update({
      where: { id: snippetId },
      data: { deletedAt: null },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(restored);
  } catch (error) {
    console.error("POST /api/v1/snippets/[snippetId]/restore error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
