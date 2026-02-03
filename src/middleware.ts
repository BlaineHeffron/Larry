import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes - require session cookie
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("larry_session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/v1/")) {
    const ip = getClientIp(request);
    const apiKey = request.headers.get("x-api-key") ?? "";
    const method = request.method;

    // Registration: 5 req/hour per IP
    if (pathname === "/api/v1/agents/register" && method === "POST") {
      const result = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
      if (!result.allowed) return rateLimitResponse(result.retryAfterSeconds);
    }

    // Authenticated write endpoints: 30 req/min per API key
    if (apiKey && method !== "GET") {
      const result = checkRateLimit(`write:${apiKey}`, 30, 60 * 1000);
      if (!result.allowed) return rateLimitResponse(result.retryAfterSeconds);
    }

    // All API endpoints: 60 req/min per IP
    const result = checkRateLimit(`api:${ip}`, 60, 60 * 1000);
    if (!result.allowed) return rateLimitResponse(result.retryAfterSeconds);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/v1/:path*"],
};
