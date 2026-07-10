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

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);
// The roleless "safe sink" must be a route that actually exists. The page lives
// at /dashboard/me (there is no top-level /me page), so redirecting to "/me"
// produced a real 404 for authenticated accounts without a resolved role.
const ROLELESS_LANDING = "/dashboard/me";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const roleHint = req.cookies.get(ROLE_COOKIE)?.value ?? null;

  const claims = accessToken ? await verifySupabaseJwt(accessToken, { ignoreExpiration: true }) : null;
  const isAuthenticated = Boolean(claims);

  // The JWT carries identity only; roles are NOT baked into it (they change when
  // grants/assignments change and a stale token would carry stale power). This is a
  // COARSE gate on the login role hint (the user's highest effective role at last
  // login); the real, per-request enforcement is the API + RLS. Prefer the fresher
  // cookie hint over any legacy app_metadata role claim.
  const verifiedRole = claims?.app_metadata?.role ?? null;
  const effectiveRole = roleHint ?? verifiedRole;

  if (AUTH_PAGES.has(pathname)) {
    if (isAuthenticated) {
      const landing = getLandingPage(effectiveRole);
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

  if (!normalizeRole(effectiveRole)) {
    if (pathname === ROLELESS_LANDING) return NextResponse.next();
    return NextResponse.redirect(new URL(ROLELESS_LANDING, req.url));
  }
  if (!hasMinRole(effectiveRole, requiredRole)) {
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
