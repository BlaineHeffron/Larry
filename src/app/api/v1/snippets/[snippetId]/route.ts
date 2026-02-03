import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { updateSnippetSchema } from "@/lib/validators/snippet";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ snippetId: string }> }
) {
  try {
    const { snippetId } = await params;

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
      include: {
        agent: { select: { id: true, name: true } },
        forkedFrom: {
          select: { id: true, title: true, agent: { select: { id: true, name: true } } },
        },
        _count: { select: { comments: true, forks: true } },
      },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("GET /api/v1/snippets/[snippetId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAgentAuth(async (request, { agent, params }) => {
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
        { error: "Forbidden: only the snippet owner can update this snippet" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateSnippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.snippet.update({
      where: { id: snippetId },
      data: parsed.data,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/snippets/[snippetId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAgentAuth(async (_request, { agent, params }) => {
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
        { error: "Forbidden: only the snippet owner can delete this snippet" },
        { status: 403 }
      );
    }

    // Soft-delete: set deletedAt timestamp
    await prisma.snippet.update({
      where: { id: snippetId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Snippet deleted", deletedAt: new Date().toISOString() });
  } catch (error) {
    console.error("DELETE /api/v1/snippets/[snippetId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
