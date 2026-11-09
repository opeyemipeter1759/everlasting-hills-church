import { NextRequest, NextResponse } from "next/server";
import { verifySupabaseJwt } from "@/lib/auth/verify-jwt";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-constants";
import { clearSessionCookies, unwrapBackendPayload } from "@/lib/auth/server-session";
import { isUnsafeCrossSiteRequest } from "@/lib/api/csrf";
import { getBackendBaseUrl } from "@/lib/api/backend-url";

export const dynamic = "force-dynamic";

const INVALID = "This password-reset link is invalid or has expired. Request a new one.";

/** Our reset email carries a one-time token_hash; the API exchanges it for a short session. */
async function accessTokenFromHash(tokenHash: string): Promise<string> {
  const upstream = await fetch(`${getBackendBaseUrl()}/auth/recovery/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tokenHash }),
    cache: "no-store",
  });
  if (!upstream.ok) return "";
  const payload = unwrapBackendPayload(await upstream.json().catch(() => null)) as { access_token?: unknown } | null;
  return typeof payload?.access_token === "string" ? payload.access_token : "";
}

/**
 * Opens a password-reset link. Our own email sends `token_hash` (exchanged
 * here, server-side); Supabase's older email put an access token in the URL
 * fragment. Either way the result goes straight into an HttpOnly cookie and is
 * never persisted in localStorage or a JavaScript-readable cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (isUnsafeCrossSiteRequest(request.headers, request.nextUrl.origin)) {
    return NextResponse.json({ error: { message: "Cross-site request rejected" } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { accessToken?: unknown; tokenHash?: unknown } | null;
  const accessToken =
    typeof body?.tokenHash === "string" && body.tokenHash
      ? await accessTokenFromHash(body.tokenHash)
      : typeof body?.accessToken === "string"
        ? body.accessToken
        : "";
  const claims = await verifySupabaseJwt(accessToken);
  if (!claims) {
    return NextResponse.json({ error: { message: INVALID } }, { status: 401 });
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
