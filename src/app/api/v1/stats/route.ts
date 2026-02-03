import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [agents, projects, snippets] = await Promise.all([
      prisma.agent.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.snippet.count(),
    ]);

    return NextResponse.json({ agents, projects, snippets });
  } catch (error) {
    console.error("GET /api/v1/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
