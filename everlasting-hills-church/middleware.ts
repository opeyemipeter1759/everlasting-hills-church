import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ROLE_COOKIE,
  getLandingPage,
  getRequiredRole,
  hasMinRole,
} from "@/lib/auth/frontend-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const role = req.cookies.get(ROLE_COOKIE)?.value ?? null;
  const isAuthenticated = Boolean(accessToken && role);
  const protectedRole = getRequiredRole(pathname);
  const authPages = ["/login", "/register", "/change-password"];

  if (authPages.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getLandingPage(role), req.url));
    }

    return NextResponse.next({ request: req });
  }

  if (protectedRole) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!hasMinRole(role, protectedRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next({ request: req });
  }

  return NextResponse.next({ request: req });
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
