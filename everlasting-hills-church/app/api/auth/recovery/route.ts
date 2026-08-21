import { NextRequest, NextResponse } from "next/server";
import { verifySupabaseJwt } from "@/lib/auth/verify-jwt";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-constants";
import { clearSessionCookies } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

/**
 * Supabase's legacy recovery email delivers a short-lived access token in the
 * URL fragment. Exchange it immediately for an HttpOnly cookie; it is never
 * persisted in localStorage or a JavaScript-readable cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: { message: "Cross-site request rejected" } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { accessToken?: unknown } | null;
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  const claims = await verifySupabaseJwt(accessToken);
  if (!claims) {
    return NextResponse.json({ error: { message: "This password-reset link is invalid or expired." } }, { status: 401 });
  }

  const response = new NextResponse(null, { status: 204 });
  // A recovery link can be opened on a shared device. Remove every prior user's
  // refresh and display cookie before establishing this short-lived session.
  clearSessionCookies(response);
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, claims.exp - Math.floor(Date.now() / 1000)),
  });
  response.headers.set("cache-control", "no-store");
  return response;
}
