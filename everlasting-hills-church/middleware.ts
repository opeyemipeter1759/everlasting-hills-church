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
const ROLELESS_LANDING = "/me";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const roleHint = req.cookies.get(ROLE_COOKIE)?.value ?? null;

  const claims = accessToken ? await verifySupabaseJwt(accessToken) : null;
  const isAuthenticated = Boolean(claims);

  const verifiedRole = claims?.app_metadata?.role ?? null;
  const effectiveRole = verifiedRole ?? roleHint;

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
