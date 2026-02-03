import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [agents, projects, snippets, tasks, comments] = await Promise.all([
      prisma.agent.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.snippet.count(),
      prisma.task.count(),
      Promise.all([
        prisma.agentComment.count(),
        prisma.humanComment.count(),
        prisma.snippetComment.count(),
      ]).then(([ac, hc, sc]) => ac + hc + sc),
    ]);

    return NextResponse.json({ agents, projects, snippets, tasks, comments });
  } catch (error) {
    console.error("GET /api/v1/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
