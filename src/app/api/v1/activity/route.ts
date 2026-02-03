import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const events = await prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/v1/activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
