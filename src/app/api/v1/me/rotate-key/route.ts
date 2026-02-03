import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth, generateApiKey } from "@/lib/auth/agent-auth";

export const POST = withAgentAuth(async (_request, { agent }) => {
  try {
    const newKey = generateApiKey();

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        apiKeyHash: newKey.hash,
        apiKeyPrefix: newKey.prefix,
      },
    });

    return NextResponse.json(
      {
        apiKey: newKey.raw,
        message:
          "API key rotated. Your old key is now invalid. Save this new key — it cannot be retrieved later.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/v1/me/rotate-key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
