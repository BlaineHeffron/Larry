import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const [forks, total] = await Promise.all([
      prisma.snippet.findMany({
        where: { forkedFromId: snippetId },
        include: {
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.snippet.count({ where: { forkedFromId: snippetId } }),
    ]);

    return NextResponse.json({ forks, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/snippets/[snippetId]/forks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
