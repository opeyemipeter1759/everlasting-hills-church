import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ROLE_COOKIE,
  getLandingPage,
  getRequiredRole,
  hasMinRole,
  normalizeRole,
} from "@/lib/auth/frontend-session";
import { verifySupabaseJwt } from "@/lib/auth/verify-jwt";

/**
 * Auth middleware.
 *
 * Threat model the original code did NOT defend against:
 *   - User edits browser cookie to set ehc_role=SUPER_ADMIN  → bypassed entire dashboard
 *   - User sets ehc_access_token=anything                    → marked "authenticated"
 *
 * What this version does:
 *   1. Reads the JWT from ehc_access_token
 *   2. Cryptographically verifies signature, expiry, audience, issuer against Supabase JWKS
 *   3. Only treats request as authenticated if verification succeeds
 *   4. For role-protected routes, reads the role hint cookie. (Week 3+: embed role as a
 *      custom claim in the JWT so this hint becomes redundant.)
 *
 * Loop-guard rules added 2026-05-26 after the ERR_TOO_MANY_REDIRECTS bug:
 *   - Never redirect to the path the user is already on.
 *   - If the only protected route at /dashboard is the dashboard itself, allow through
 *     so the page can render its own "no access" UI (cleaner than infinite redirects).
 *   - "Authenticated but no role" gets a single redirect to /me (which only requires being
 *     logged in, never a role) — that's the safe terminal state for orphan accounts.
 */
const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);
const ROLELESS_LANDING = "/me";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const roleHint = req.cookies.get(ROLE_COOKIE)?.value ?? null;

  // Verify JWT signature. null = unauthenticated (bad sig, expired, or absent).
  const claims = accessToken ? await verifySupabaseJwt(accessToken) : null;
  const isAuthenticated = Boolean(claims);

  // Auth pages: signed-in users get redirected to their landing page.
  if (AUTH_PAGES.has(pathname)) {
    if (isAuthenticated) {
      const landing = getLandingPage(roleHint);
      // Don't redirect to where we already are — would loop on /login itself if landing == /login.
      if (landing !== pathname) {
        return NextResponse.redirect(new URL(landing, req.url));
      }
    }
    return NextResponse.next();
  }

  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) return NextResponse.next();

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated but no role at all (orphan Supabase account with no Profile).
  // /me is always reachable for any signed-in user and never re-redirects, so it's the safe sink.
  if (!normalizeRole(roleHint)) {
    if (pathname === ROLELESS_LANDING) return NextResponse.next();
    return NextResponse.redirect(new URL(ROLELESS_LANDING, req.url));
  }

  // Insufficient role for this path.
  if (!hasMinRole(roleHint, requiredRole)) {
    // Loop guard: if the safe-fallback is the current path, just let through.
    // (Page itself can render a "you don't have access" view.)
    const fallback = "/dashboard";
    if (pathname === fallback) return NextResponse.next();
    return NextResponse.redirect(new URL(fallback, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/me",
    "/me/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
