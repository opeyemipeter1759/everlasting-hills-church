import { NextRequest, NextResponse } from "next/server";
import {
  ROLE_COOKIE,
  getLandingPage,
  getRequiredRole,
  hasAnyMinRole,
  hasMinRole,
  normalizeRole,
} from "@/lib/auth/frontend-session";
import {
  ACCESS_TOKEN_COOKIE,
  isLogoutPending,
  LOGOUT_PENDING_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/session-constants";
import {
  clearSessionCookies,
  getBackendSession,
  setSessionCookies,
  unwrapBackendPayload,
  type BackendSession,
} from "@/lib/auth/server-session";
import { verifySupabaseJwt } from "@/lib/auth/verify-jwt";
import { getBackendBaseUrl } from "@/lib/api/backend-url";
import { resolveTrustedRoutingRole } from "@/lib/auth/routing-role";

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);
const ROLELESS_LANDING = "/dashboard/profile";

async function refreshSession(refreshToken: string): Promise<BackendSession | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return getBackendSession(await response.json());
  } catch {
    return null;
  }
}

interface BackendRoleSnapshot {
  role: string | null;
  effectiveRoles: string[];
}

async function getLiveBackendRoles(accessToken: string): Promise<BackendRoleSnapshot | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/auth/me`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = unwrapBackendPayload(await response.json());
    if (!payload || typeof payload !== "object") return null;
    const value = payload as { role?: unknown; effectiveRoles?: unknown };
    const role = typeof value.role === "string" && value.role ? value.role : null;
    const effectiveRoles = Array.isArray(value.effectiveRoles)
      ? value.effectiveRoles.filter((item): item is string => typeof item === "string" && Boolean(item))
      : [];
    if (role && !effectiveRoles.includes(role)) effectiveRoles.push(role);
    return { role, effectiveRoles };
  } catch {
    return null;
  }
}

function requestHeadersWithSession(request: NextRequest, session: BackendSession): Headers {
  const headers = new Headers(request.headers);
  const values = new Map(request.cookies.getAll().map(({ name, value }) => [name, value]));
  values.set(ACCESS_TOKEN_COOKIE, session.access_token);
  if (session.refresh_token) values.set(REFRESH_TOKEN_COOKIE, session.refresh_token);
  if (session.user.role) values.set(ROLE_COOKIE, session.user.role);
  else values.delete(ROLE_COOKIE);
  headers.set(
    "cookie",
    Array.from(values.entries()).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; "),
  );
  return headers;
}

function withSessionCookies(response: NextResponse, session: BackendSession | null): NextResponse {
  if (session) setSessionCookies(response, session);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLogoutPending(request.cookies.get(LOGOUT_PENDING_COOKIE)?.value)) {
    const response = AUTH_PAGES.has(pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));
    clearSessionCookies(response);
    return response;
  }
  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  let claims = accessToken ? await verifySupabaseJwt(accessToken) : null;
  let refreshedSession: BackendSession | null = null;
  let liveRolesPromise: Promise<BackendRoleSnapshot | null> | null = null;

  if (!claims && refreshToken) {
    refreshedSession = await refreshSession(refreshToken);
    if (refreshedSession) {
      accessToken = refreshedSession.access_token;
      claims = await verifySupabaseJwt(accessToken);
    }
  }

  const isAuthenticated = Boolean(claims);
  const loadLiveRoles = () => {
    if (!claims || !accessToken) return Promise.resolve(null);
    liveRolesPromise ??= getLiveBackendRoles(accessToken);
    return liveRolesPromise;
  };
  // ROLE_COOKIE is display-only. Nest resolves live grants/assignments and is
  // authoritative on ordinary requests; a successful authenticated refresh is
  // fresh enough to skip the extra lookup unless a secondary role is needed.
  const effectiveRole = await resolveTrustedRoutingRole({
    hasRefreshedSession: Boolean(refreshedSession),
    refreshedRole: refreshedSession?.user.role,
    signedRole: claims?.app_metadata?.role,
    untrustedRoleHint: request.cookies.get(ROLE_COOKIE)?.value,
    loadBackendRole:
      claims && accessToken ? async () => (await loadLiveRoles())?.role ?? null : undefined,
  });
  const downstreamHeaders = refreshedSession
    ? requestHeadersWithSession(request, refreshedSession)
    : undefined;

  if (AUTH_PAGES.has(pathname)) {
    if (isAuthenticated) {
      return withSessionCookies(
        NextResponse.redirect(
          new URL(normalizeRole(effectiveRole) ? getLandingPage(effectiveRole) : ROLELESS_LANDING, request.url),
        ),
        refreshedSession,
      );
    }
    const response = NextResponse.next();
    if (accessToken || refreshToken) clearSessionCookies(response);
    return response;
  }

  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) return NextResponse.next();

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    clearSessionCookies(response);
    return response;
  }

  if (!normalizeRole(effectiveRole)) {
    if (pathname === ROLELESS_LANDING) {
      return withSessionCookies(
        NextResponse.next(downstreamHeaders ? { request: { headers: downstreamHeaders } } : undefined),
        refreshedSession,
      );
    }
    return withSessionCookies(
      NextResponse.redirect(new URL(ROLELESS_LANDING, request.url)),
      refreshedSession,
    );
  }

  let roleAllowed = hasMinRole(effectiveRole, requiredRole);
  if (!roleAllowed) {
    const liveRoles = await loadLiveRoles();
    roleAllowed = hasAnyMinRole(liveRoles?.effectiveRoles ?? [], requiredRole);
  }

  if (!roleAllowed) {
    return withSessionCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      refreshedSession,
    );
  }

  return withSessionCookies(
    NextResponse.next(downstreamHeaders ? { request: { headers: downstreamHeaders } } : undefined),
    refreshedSession,
  );
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
