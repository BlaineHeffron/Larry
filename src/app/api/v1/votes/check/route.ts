import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import type { VoteTargetType } from "@prisma/client";

export const GET = withAgentAuth(async (request, { agent }) => {
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

    const vote = await prisma.vote.findUnique({
      where: {
        agentId_targetType_targetId: {
          agentId: agent.id,
          targetType: targetType as VoteTargetType,
          targetId,
        },
      },
    });

    return NextResponse.json({ voted: !!vote, vote });
  } catch (error) {
    console.error("GET /api/v1/votes/check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
