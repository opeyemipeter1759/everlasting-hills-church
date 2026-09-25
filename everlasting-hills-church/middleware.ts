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
import {
  LOOKUP_TIMEOUT_MS,
  REFRESH_TIMEOUT_MS,
  backendDeadline,
  fetchBackendWithin,
  isBackendTimeout,
} from "@/lib/auth/backend-deadline";
import { resolveTrustedRoutingRole } from "@/lib/auth/routing-role";
import { NAV_ITEMS_FLAT, type UserRole as ConfigUserRole } from "@/config/config";
import { isAudioProductionUnitName } from "@/lib/audio-production";
import {
  canRoleAccessItem,
  matchNavItemForPath,
  toNavPermissionsMap,
  type NavPermissionEntry,
  type NavPermissionsMap,
} from "@/lib/nav-permissions-core";

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);
const ROLELESS_LANDING = "/dashboard/profile";

// Sermon management is PASTOR+ by role, but every member of the Audio
// (Post) Production unit gets full Super Admin power over the whole Sermons
// section — list, new, edit, analytics, per-sermon engagement. Mirrors the
// API, where PageAccessGuard elevates the unit on /sermons endpoints.
const AUDIO_PRODUCTION_SERMON_PATHS = [/^\/dashboard\/pastor\/sermons(\/.*)?$/];

function isAudioProductionSermonPath(pathname: string): boolean {
  return AUDIO_PRODUCTION_SERMON_PATHS.some((re) => re.test(pathname));
}

async function unitListIncludesAudioProduction(path: string, accessToken: string, deadline: number): Promise<boolean> {
  try {
    const response = await fetchBackendWithin(
      path,
      { method: "GET", headers: { authorization: `Bearer ${accessToken}` } },
      { deadline, maxMs: LOOKUP_TIMEOUT_MS },
    );
    if (!response.ok) return false;
    const payload = unwrapBackendPayload(await response.json());
    if (!Array.isArray(payload)) return false;
    return payload.some(
      (unit) => unit && typeof unit === "object" && isAudioProductionUnitName((unit as { name?: unknown }).name),
    );
  } catch {
    return false;
  }
}

// "/units/my-memberships" deliberately excludes units a person leads or
// assists (it's the plain-member list), so the unit's own lead must be
// checked separately via "/units/mine" — otherwise Audio Production's leader
// would be the one person this carve-out locks out.
async function isAudioProductionMember(accessToken: string, deadline: number): Promise<boolean> {
  if (await unitListIncludesAudioProduction("/units/mine", accessToken, deadline)) return true;
  return unitListIncludesAudioProduction("/units/my-memberships", accessToken, deadline);
}

// Admin-configured overrides from the Role Access Permissions screen. When an
// item has no saved override this returns a map simply lacking that key, so
// callers can tell "no override" (fall through to default hierarchy) apart
// from "override explicitly set" (authoritative, replaces the default).
async function fetchNavPermissionsMap(accessToken: string, deadline: number): Promise<NavPermissionsMap | null> {
  try {
    const response = await fetchBackendWithin(
      "/nav-permissions",
      { method: "GET", headers: { authorization: `Bearer ${accessToken}` } },
      { deadline, maxMs: LOOKUP_TIMEOUT_MS },
    );
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

/**
 * "timeout" is not "refresh failed": the API was too slow (usually waking from
 * zero), the session may be perfectly good, and it must not be thrown away.
 */
type RefreshResult = BackendSession | null | "timeout";

async function refreshSessionRaw(refreshToken: string, deadline: number): Promise<RefreshResult> {
  try {
    const response = await fetchBackendWithin(
      "/auth/refresh",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      { deadline, maxMs: REFRESH_TIMEOUT_MS },
    );
    if (!response.ok) return null;
    return getBackendSession(await response.json());
  } catch (error) {
    return isBackendTimeout(error) ? "timeout" : null;
  }
}

// Supabase refresh tokens are single-use — redeeming one invalidates it and
// issues a new one. Several requests can land on the same warm edge isolate
// around the same moment (a navigation plus its prefetches, say) all holding
// the same stale-looking refresh token; without de-duping, all but the first
// would get rejected by Supabase and read as "refresh failed", clearing a
// session that had just been renewed a moment earlier by its sibling.
const inFlightRefreshes = new Map<string, Promise<RefreshResult>>();

async function refreshSession(refreshToken: string, deadline: number): Promise<RefreshResult> {
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;
  const attempt = refreshSessionRaw(refreshToken, deadline).finally(() => {
    inFlightRefreshes.delete(refreshToken);
  });
  inFlightRefreshes.set(refreshToken, attempt);
  return attempt;
}

interface BackendRoleSnapshot {
  role: string | null;
  effectiveRoles: string[];
}

async function getLiveBackendRoles(accessToken: string, deadline: number): Promise<BackendRoleSnapshot | null> {
  try {
    const response = await fetchBackendWithin(
      "/auth/me",
      { method: "GET", headers: { authorization: `Bearer ${accessToken}` } },
      { deadline, maxMs: LOOKUP_TIMEOUT_MS },
    );
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
async function fetchMyGrantedHrefs(accessToken: string, deadline: number): Promise<Set<string> | null> {
  try {
    const response = await fetchBackendWithin(
      "/nav-permissions/my-grants",
      { method: "GET", headers: { authorization: `Bearer ${accessToken}` } },
      { deadline, maxMs: LOOKUP_TIMEOUT_MS },
    );
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
/** A same-site path to return to after login; another site ("//evil.com") or a login page is ignored. */
export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return AUTH_PAGES.has(next.split("?")[0]) ? null : next;
}

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
  // Every API call below shares this, so the middleware always answers before
  // Vercel's 25-second limit even when the API is slow to wake.
  const deadline = backendDeadline();
  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  let claims = accessToken ? await verifySupabaseJwt(accessToken) : null;
  let refreshedSession: BackendSession | null = null;
  let liveRolesPromise: Promise<BackendRoleSnapshot | null> | null = null;

  let refreshTimedOut = false;

  if (!claims && refreshToken) {
    const refreshed = await refreshSession(refreshToken, deadline);
    refreshTimedOut = refreshed === "timeout";
    refreshedSession = refreshed === "timeout" ? null : refreshed;
    if (refreshedSession) {
      accessToken = refreshedSession.access_token;
      claims = await verifySupabaseJwt(accessToken);
    }
  }

  const isAuthenticated = Boolean(claims);
  const loadLiveRoles = () => {
    if (!claims || !accessToken) return Promise.resolve(null);
    liveRolesPromise ??= getLiveBackendRoles(accessToken, deadline);
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
      // Back to the page that sent them here (see the timeout case below), else home.
      const next = safeNextPath(searchParams.get("next"));
      const landing = normalizeRole(effectiveRole) ? getLandingPage(effectiveRole) : ROLELESS_LANDING;
      return withSessionCookies(NextResponse.redirect(new URL(next ?? landing, request.url)), refreshedSession);
    }
    const response = NextResponse.next();
    // A slow API says nothing about the session: keep it for the next try.
    if ((accessToken || refreshToken) && !refreshTimedOut) clearSessionCookies(response);
    return response;
  }

  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) return NextResponse.next();

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    // When the API was only slow, the session stays: by the time /login loads
    // the API is awake, the refresh succeeds there, and "next" brings them back.
    if (!refreshTimedOut) clearSessionCookies(response);
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
  // Admin-configured Role Access Permissions: if the matched nav item has a
  // saved override, that explicit role set is authoritative for this request
  // — it replaces (not adds to) the hierarchy-based result above, so an admin
  // can both grant beyond the default minRole and revoke below it. Items no
  // admin has ever touched have no map entry, so this leaves roleAllowed
  // exactly as already computed.
  if (accessToken) {
    const matchedItem = matchNavItemForPath(pathname, NAV_ITEMS_FLAT);
    if (matchedItem) {
      const overrides = await fetchNavPermissionsMap(accessToken, deadline);
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

  // Audio Production's sermon carve-out. Checked after the saved role list
  // above on purpose: that list replaces the role result, and a list saved
  // for Sermons (typically PASTOR-only) used to silently overwrite this and
  // lock the whole team out. Like a named grant, it only ever widens access.
  if (!roleAllowed && accessToken && isAudioProductionSermonPath(pathname)) {
    roleAllowed = await isAudioProductionMember(accessToken, deadline);
  }

  // Named exceptions: only consulted once every role-based path above has
  // already said no, since these only ever widen access, never narrow it.
  if (!roleAllowed && accessToken) {
    const matchedItem = matchNavItemForPath(pathname, NAV_ITEMS_FLAT);
    if (matchedItem) {
      const grantedHrefs = await fetchMyGrantedHrefs(accessToken, deadline);
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
