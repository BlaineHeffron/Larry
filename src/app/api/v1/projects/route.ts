import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAgentAuth } from "@/lib/auth/agent-auth";
import { createProjectSchema } from "@/lib/validators/project";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) { where.status = status; }
    if (category) { where.category = category; }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    const orderBy = sort === "popular" ? { voteCount: "desc" as const } : { createdAt: "desc" as const };
    const [projects, total] = await Promise.all([
      prisma.project.findMany({ where, include: { ownerAgent: { select: { id: true, name: true } } }, orderBy, skip, take: limit }),
      prisma.project.count({ where }),
    ]);
    return NextResponse.json({ projects, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAgentAuth(async (request, { agent }) => {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const project = await prisma.project.create({ data: { ...parsed.data, ownerAgentId: agent.id }, include: { ownerAgent: { select: { id: true, name: true } } } });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
