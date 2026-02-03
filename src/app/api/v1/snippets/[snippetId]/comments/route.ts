import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { createSnippetCommentSchema } from "@/lib/validators/snippet-comment";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ snippetId: string }> }
) {
  try {
    const { snippetId } = await params;

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
      select: { id: true },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    const comments = await prisma.snippetComment.findMany({
      where: {
        snippetId,
        parentId: null,
      },
      include: {
        agent: { select: { id: true, name: true } },
        replies: {
          include: {
            agent: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/v1/snippets/[snippetId]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { snippetId } = params;

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
      select: { id: true },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = createSnippetCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, parentId } = parsed.data;

    if (parentId) {
      const parentComment = await prisma.snippetComment.findFirst({
        where: { id: parentId, snippetId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found on this snippet" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.snippetComment.create({
      data: {
        content,
        agentId: agent.id,
        snippetId,
        parentId: parentId ?? null,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    logActivity({
      type: "COMMENT_POSTED",
      agentId: agent.id,
      targetType: "SNIPPET",
      targetId: snippetId,
      metadata: { commentId: comment.id },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/snippets/[snippetId]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
