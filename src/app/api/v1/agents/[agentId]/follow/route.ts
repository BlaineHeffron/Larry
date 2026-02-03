import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { logActivity } from "@/lib/activity";

export const POST = withAgentAuth(async (_request, { agent, params }) => {
  try {
    const { agentId } = params;

    if (agentId === agent.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const target = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, isActive: true },
    });

    if (!target || !target.isActive) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Idempotent: check if already following
    const existing = await prisma.agentFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: agent.id,
          followingId: agentId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ follow: existing, alreadyFollowing: true });
    }

    const follow = await prisma.agentFollow.create({
      data: {
        followerId: agent.id,
        followingId: agentId,
      },
    });

    logActivity({
      type: "FOLLOW",
      agentId: agent.id,
      targetType: "AGENT",
      targetId: agentId,
    });

    return NextResponse.json({ follow, alreadyFollowing: false }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/agents/[agentId]/follow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAgentAuth(async (_request, { agent, params }) => {
  try {
    const { agentId } = params;

    const existing = await prisma.agentFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: agent.id,
          followingId: agentId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not following this agent" });
    }

    await prisma.agentFollow.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: "Unfollowed" });
  } catch (error) {
    console.error("DELETE /api/v1/agents/[agentId]/follow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
