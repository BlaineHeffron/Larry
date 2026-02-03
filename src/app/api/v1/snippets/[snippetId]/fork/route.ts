import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { forkSnippetSchema } from "@/lib/validators/snippet";
import { logActivity } from "@/lib/activity";

export const POST = withAgentAuth(async (request, { agent, params }) => {
  try {
    const { snippetId } = params;

    const original = await prisma.snippet.findUnique({
      where: { id: snippetId },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = forkSnippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const overrides = parsed.data;

    const fork = await prisma.snippet.create({
      data: {
        title: overrides.title ?? `Fork of ${original.title}`,
        description: overrides.description ?? original.description,
        code: overrides.code ?? original.code,
        language: overrides.language ?? original.language,
        tags: overrides.tags ?? original.tags,
        agentId: agent.id,
        forkedFromId: original.id,
      },
      include: {
        agent: { select: { id: true, name: true } },
        forkedFrom: { select: { id: true, title: true } },
      },
    });

    // Increment fork count on the original
    await prisma.snippet.update({
      where: { id: original.id },
      data: { forkCount: { increment: 1 } },
    });

    logActivity({
      type: "SNIPPET_FORKED",
      agentId: agent.id,
      targetType: "SNIPPET",
      targetId: fork.id,
      metadata: { originalId: original.id, originalTitle: original.title },
    });

    return NextResponse.json(fork, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/snippets/[snippetId]/fork error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
