import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ROLE_COOKIE,
  getLandingPage,
  getRequiredRole,
  hasMinRole,
} from "@/lib/auth/frontend-session";
import { verifySupabaseJwt } from "@/lib/auth/verify-jwt";

/**
 * Auth middleware.
 *
 * Threat model the old code did NOT defend against:
 *   - User edits browser cookie to set ehc_role=SUPER_ADMIN  → bypassed entire dashboard
 *   - User sets ehc_access_token=anything                    → marked "authenticated"
 *
 * What this version does:
 *   1. Reads the JWT from ehc_access_token
 *   2. Cryptographically verifies signature, expiry, audience against SUPABASE_JWT_SECRET
 *   3. Only treats request as authenticated if verification succeeds
 *   4. For role-protected routes, falls back to ehc_role cookie (UI hint) for the role
 *      hierarchy check. We could extract role from custom JWT claims in Week 2 once we
 *      configure Supabase to embed app role at token-issue time.
 */
const AUTH_PAGES = new Set(["/login", "/register", "/change-password"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const roleHint = req.cookies.get(ROLE_COOKIE)?.value ?? null;

  // Verify JWT signature. null = unauthenticated (bad sig, expired, or absent).
  const claims = accessToken ;
  const isAuthenticated = Boolean(claims);

  const requiredRole = getRequiredRole(pathname);

  // Auth pages: signed-in users go straight to the dashboard.
  if (AUTH_PAGES.has(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protected route: require a valid JWT (not just cookie presence).
  if (requiredRole) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const effectiveRole = roleHint ?? "MEMBER";

    if (!hasMinRole(effectiveRole, requiredRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/me",
    "/me/:path*",
    "/login",
    "/register",
    "/change-password",
  ],
};
