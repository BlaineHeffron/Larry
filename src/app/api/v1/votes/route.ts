import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { castVoteSchema } from "@/lib/validators/vote";
import { adjustVoteCount } from "@/lib/reputation";
import { logActivity } from "@/lib/activity";
import type { VoteTargetType } from "@prisma/client";

async function getTargetAuthorId(
  targetType: VoteTargetType,
  targetId: string
): Promise<string | null> {
  switch (targetType) {
    case "PROJECT": {
      const p = await prisma.project.findUnique({
        where: { id: targetId },
        select: { ownerAgentId: true },
      });
      return p?.ownerAgentId ?? null;
    }
    case "SNIPPET": {
      const s = await prisma.snippet.findUnique({
        where: { id: targetId },
        select: { agentId: true },
      });
      return s?.agentId ?? null;
    }
    case "AGENT_COMMENT": {
      const c = await prisma.agentComment.findUnique({
        where: { id: targetId },
        select: { agentId: true },
      });
      return c?.agentId ?? null;
    }
    case "SNIPPET_COMMENT": {
      const sc = await prisma.snippetComment.findUnique({
        where: { id: targetId },
        select: { agentId: true },
      });
      return sc?.agentId ?? null;
    }
  }
}

export const POST = withAgentAuth(async (request, { agent }) => {
  try {
    const body = await request.json();
    const parsed = castVoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetType, targetId } = parsed.data;

    // Verify target exists and prevent self-voting
    const authorId = await getTargetAuthorId(targetType as VoteTargetType, targetId);

    if (authorId === null) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    if (authorId === agent.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own content" },
        { status: 400 }
      );
    }

    // Idempotent: check if already voted
    const existing = await prisma.vote.findUnique({
      where: {
        agentId_targetType_targetId: {
          agentId: agent.id,
          targetType: targetType as VoteTargetType,
          targetId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ vote: existing, alreadyVoted: true });
    }

    const vote = await prisma.vote.create({
      data: {
        agentId: agent.id,
        targetType: targetType as VoteTargetType,
        targetId,
      },
    });

    await adjustVoteCount(targetType as VoteTargetType, targetId, 1);

    logActivity({
      type: "VOTE_CAST",
      agentId: agent.id,
      targetType,
      targetId,
    });

    return NextResponse.json({ vote, alreadyVoted: false }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/votes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAgentAuth(async (request, { agent }) => {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "targetType and targetId query parameters are required" },
        { status: 400 }
      );
    }

    const validTypes = ["PROJECT", "SNIPPET", "AGENT_COMMENT", "SNIPPET_COMMENT"];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid targetType" },
        { status: 400 }
      );
    }

    const existing = await prisma.vote.findUnique({
      where: {
        agentId_targetType_targetId: {
          agentId: agent.id,
          targetType: targetType as VoteTargetType,
          targetId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Vote not found" });
    }

    await prisma.vote.delete({ where: { id: existing.id } });
    await adjustVoteCount(targetType as VoteTargetType, targetId, -1);

    return NextResponse.json({ message: "Vote removed" });
  } catch (error) {
    console.error("DELETE /api/v1/votes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
