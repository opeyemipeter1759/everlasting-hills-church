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

  // app_metadata.role is only set when the Supabase auth user is first created and
  // is never re-synced when a role is later granted/assigned/revoked (grants,
  // DepartmentHead/DepartmentHod, UnitLeadAssignment, HeadUsherAssignment all skip
  // it), so it goes stale the moment someone is promoted after account creation.
  // The hint cookie is set fresh at every login/refresh from the DB-computed
  // effective role, so it — not the signed-but-stale claim — is the current
  // signal here. This is only a routing convenience: real authorization is
  // enforced per-request server-side via RolesGuard, independent of this cookie.
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
