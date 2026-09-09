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
import { NAV_ITEMS_FLAT, type UserRole as ConfigUserRole } from "@/config/config";
import {
  canRoleAccessItem,
  matchNavItemForPath,
  toNavPermissionsMap,
  type NavPermissionEntry,
  type NavPermissionsMap,
} from "@/lib/nav-permissions-core";

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);
const ROLELESS_LANDING = "/dashboard/profile";

// Sermon management is PASTOR+ by role, but a plain member of the "Audio
// Production" unit gets the same access to these specific pages (list, new,
// edit — not analytics, which stays PASTOR-only). Mirrors the same carve-out
// already enforced on the backend by SermonsAuthService.
const AUDIO_PRODUCTION_SERMON_PATHS = [
  /^\/dashboard\/pastor\/sermons$/,
  /^\/dashboard\/pastor\/sermons\/new$/,
  /^\/dashboard\/pastor\/sermons\/[^/]+\/edit$/,
];

function isAudioProductionSermonPath(pathname: string): boolean {
  return AUDIO_PRODUCTION_SERMON_PATHS.some((re) => re.test(pathname));
}

async function unitListIncludesAudioProduction(path: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = unwrapBackendPayload(await response.json());
    if (!Array.isArray(payload)) return false;
    return payload.some(
      (unit) => unit && typeof unit === "object" && (unit as { name?: unknown }).name === "Audio Production",
    );
  } catch {
    return false;
  }
}

// "/units/my-memberships" deliberately excludes units a person leads or
// assists (it's the plain-member list), so the unit's own lead must be
// checked separately via "/units/mine" — otherwise Audio Production's leader
// would be the one person this carve-out locks out.
async function isAudioProductionMember(accessToken: string): Promise<boolean> {
  if (await unitListIncludesAudioProduction("/units/mine", accessToken)) return true;
  return unitListIncludesAudioProduction("/units/my-memberships", accessToken);
}

// Admin-configured overrides from the Role Access Permissions screen. When an
// item has no saved override this returns a map simply lacking that key, so
// callers can tell "no override" (fall through to default hierarchy) apart
// from "override explicitly set" (authoritative, replaces the default).
async function fetchNavPermissionsMap(accessToken: string): Promise<NavPermissionsMap | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/nav-permissions`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = unwrapBackendPayload(await response.json());
    if (!Array.isArray(payload)) return null;
    const entries = payload.filter((item): item is NavPermissionEntry => {
      if (!item || typeof item !== "object") return false;
      const value = item as { itemHref?: unknown; roles?: unknown };
      return typeof value.itemHref === "string" && Array.isArray(value.roles);
    });
    return toNavPermissionsMap(entries);
  } catch {
    return null;
  }
}

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

// Named exceptions (Permissions page): specific person / unit members / unit
// leader, resolved self-scoped by the backend from the caller's own token —
// never the full grants table, so this stays cheap and reveals nothing about
// other people's exceptions. Only ever widens access, so it's safe to call
// only when the role-based checks above have already failed.
async function fetchMyGrantedHrefs(accessToken: string): Promise<Set<string> | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/nav-permissions/my-grants`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = unwrapBackendPayload(await response.json());
    if (!payload || typeof payload !== "object") return null;
    const hrefs = (payload as { hrefs?: unknown }).hrefs;
    if (!Array.isArray(hrefs)) return null;
    return new Set(hrefs.filter((href): href is string => typeof href === "string"));
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

// Google's OAuth redirect_uri points at the calendar page itself (see
// app/dashboard/(member)/calendar/page.tsx), which forwards code+state on to
// the real Nest handler, so the flow stays on the app's own branded domain
// instead of a separate route. That page normally requires a session like
// any other /dashboard/* route — but identity for this one specific request
// shape travels in Google's signed `state`, not a session cookie, so a
// session that lapsed during the consent round trip shouldn't strand the
// user on a login redirect instead of completing the connection. Scoped to
// exactly this path + query shape so a normal calendar visit is unaffected.
function isGoogleCalendarCallback(pathname: string, searchParams: URLSearchParams): boolean {
  return pathname === "/dashboard/calendar" && searchParams.has("code") && searchParams.has("state");
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (isGoogleCalendarCallback(pathname, searchParams)) return NextResponse.next();
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
  if (!roleAllowed && accessToken && isAudioProductionSermonPath(pathname)) {
    roleAllowed = await isAudioProductionMember(accessToken);
  }

  // Admin-configured Role Access Permissions: if the matched nav item has a
  // saved override, that explicit role set is authoritative for this request
  // — it replaces (not adds to) the hierarchy-based result above, so an admin
  // can both grant beyond the default minRole and revoke below it. Items no
  // admin has ever touched have no map entry, so this leaves roleAllowed
  // exactly as already computed.
  if (accessToken) {
    const matchedItem = matchNavItemForPath(pathname, NAV_ITEMS_FLAT);
    if (matchedItem) {
      const overrides = await fetchNavPermissionsMap(accessToken);
      if (overrides?.has(matchedItem.href)) {
        const liveRoles = await loadLiveRoles();
        const candidateRoles = new Set<ConfigUserRole>();
        const normalizedEffective = normalizeRole(effectiveRole);
        if (normalizedEffective) candidateRoles.add(normalizedEffective);
        for (const role of liveRoles?.effectiveRoles ?? []) {
          const normalized = normalizeRole(role);
          if (normalized) candidateRoles.add(normalized);
        }
        roleAllowed = Array.from(candidateRoles).some((role) =>
          canRoleAccessItem(role, matchedItem, overrides),
        );
      }
    }
  }

  // Named exceptions: only consulted once every role-based path above has
  // already said no, since these only ever widen access, never narrow it.
  if (!roleAllowed && accessToken) {
    const matchedItem = matchNavItemForPath(pathname, NAV_ITEMS_FLAT);
    if (matchedItem) {
      const grantedHrefs = await fetchMyGrantedHrefs(accessToken);
      if (grantedHrefs?.has(matchedItem.href)) roleAllowed = true;
    }
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
