import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  // Show only the host portion, never credentials
  let host = "(unparseable)";
  try {
    const url = new URL(dbUrl);
    host = url.hostname;
  } catch {
    host = "(invalid URL format)";
  }

  let dbStatus = "unreachable";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "error",
    dbHost: host,
    dbStatus,
  });
}
