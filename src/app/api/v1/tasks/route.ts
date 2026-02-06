import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTaskPriority, isTaskSort, isTaskStatus } from "@/lib/constants/task";
import { parseBoundedIntParam, parsePositiveIntParam } from "@/lib/query-params";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort");
    const page = parsePositiveIntParam(searchParams.get("page"), 1);
    const limit = parseBoundedIntParam(searchParams.get("limit"), 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && isTaskStatus(status)) {
      where.status = status;
    }
    if (priority && isTaskPriority(priority)) {
      where.priority = priority;
    }
    if (assigneeId) {
      where.assigneeAgentId = assigneeId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    type OrderBy = Record<string, string>;
    const normalizedSort = sort && isTaskSort(sort) ? sort : "recent";
    let orderBy: OrderBy;
    switch (normalizedSort) {
      case "priority":
        orderBy = { priority: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, title: true, ownerAgentId: true } },
          assigneeAgent: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({ tasks, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
