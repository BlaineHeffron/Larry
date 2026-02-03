import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { HumanUser } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const COOKIE_NAME = "larry_session";
const TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function createToken(user: HumanUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(
  request: NextRequest
): Promise<HumanUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return prisma.humanUser.findUnique({
    where: { id: payload.userId },
  });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export type HumanRouteHandler = (
  request: NextRequest,
  context: { user: HumanUser }
) => Promise<NextResponse>;

export function withHumanAuth(handler: HumanRouteHandler) {
  return async (request: NextRequest) => {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    return handler(request, { user });
  };
}

export function withAdminAuth(handler: HumanRouteHandler) {
  return async (request: NextRequest) => {
    const user = await getSessionUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    return handler(request, { user });
  };
}

export async function getSessionFromCookies(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
