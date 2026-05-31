/**
 * Single source of truth for client-side auth cookies.
 *
 * After login, the backend returns a real Supabase JWT. We persist:
 *   - ehc_access_token  : the actual Supabase JWT (signed, verifiable)
 *   - ehc_role          : user role (UI hint only — middleware re-verifies via JWT)
 *   - ehc_user_email    : email (UI hint)
 *   - ehc_logged_in     : presence flag (UI hint)
 *
 * Why JS-readable (not HttpOnly): Axios needs to attach the JWT as a Bearer header.
 * Migrating to HttpOnly + Next.js API proxy is a Week 2 task — tracked.
 *
 * Why we still keep role/email as separate cookies: middleware decodes the JWT for the
 * authoritative role, but the UI gets faster initial paint reading the hint cookie instead
 * of decoding JWT on every render.
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "PASTOR"
  | "ADMIN"
  | "UNIT_LEAD"
  | "MEMBER";

const ROLE_LEVELS: Record<UserRole, number> = {
  MEMBER: 1,
  UNIT_LEAD: 2,
  ADMIN: 3,
  PASTOR: 4,
  SUPER_ADMIN: 5,
};

export const ACCESS_TOKEN_COOKIE = "ehc_access_token";
export const ROLE_COOKIE = "ehc_role";
export const EMAIL_COOKIE = "ehc_user_email";
export const FULL_NAME_COOKIE = "ehc_user_full_name";
export const PICTURE_COOKIE = "ehc_user_picture";
export const LOGGED_IN_COOKIE = "ehc_logged_in";

export interface FrontendSessionUser {
  email: string | null;
  role: string | null;
  fullName: string | null;
  picture: string | null;
  loggedIn: boolean;
}

export const ROLE_OPTIONS = [
  { label: "Member", value: "member" },
  { label: "Leader", value: "leader" },
  { label: "Unit Head", value: "unit head" },
  { label: "Admin", value: "admin" },
  { label: "Pastor", value: "pastor" },
  { label: "Super Admin", value: "superadmin" },
] as const;

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;

  const cleaned = role.trim().toLowerCase();
  if (cleaned === "member") return "MEMBER";
  if (cleaned === "leader" || cleaned === "unit head" || cleaned === "unit_head") return "UNIT_LEAD";
  if (cleaned === "admin") return "ADMIN";
  if (cleaned === "pastor") return "PASTOR";
  if (cleaned === "superadmin" || cleaned === "super admin" || cleaned === "super_admin") return "SUPER_ADMIN";

  const upper = cleaned.toUpperCase().replace(/\s+/g, "_");
  if (upper in ROLE_LEVELS) return upper as UserRole;

  return null;
}

export function hasMinRole(userRole: string | null | undefined, minRole: UserRole): boolean {
  const normalized = normalizeRole(userRole);
  if (!normalized) return false;
  return ROLE_LEVELS[normalized] >= ROLE_LEVELS[minRole];
}

export function getLandingPage(role: string | null | undefined): string {
  return normalizeRole(role) ? "/dashboard" : "/login";
}

export function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/dashboard/audit-log")) return "SUPER_ADMIN";

  if (
    pathname.startsWith("/dashboard/subscribers") ||
    pathname.startsWith("/dashboard/alerts") ||
    pathname.startsWith("/dashboard/follow-ups") ||
    pathname.startsWith("/dashboard/reports") ||
    pathname.startsWith("/dashboard/giving") ||
    pathname.startsWith("/dashboard/sermons") ||
    pathname.startsWith("/dashboard/analytics/engagement") ||
    pathname.startsWith("/dashboard/analytics/giving")
  ) {
    return "PASTOR";
  }

  if (
    pathname.startsWith("/dashboard/members") ||
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/first-timers") ||
    pathname.startsWith("/dashboard/services") ||
    pathname.startsWith("/dashboard/events") ||
    pathname.startsWith("/dashboard/submissions") ||
    pathname.startsWith("/dashboard/announcements") ||
    pathname.startsWith("/dashboard/inventory") ||
    pathname.startsWith("/dashboard/analytics/attendance") ||
    pathname.startsWith("/dashboard/analytics/growth") ||
    pathname.startsWith("/dashboard/analytics/first-timers")
  ) {
    return "ADMIN";
  }

  if (pathname.startsWith("/dashboard/units") || pathname.startsWith("/dashboard/analytics/departments")) {
    return "UNIT_LEAD";
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/me")) {
    return "MEMBER";
  }

  return null;
}

// ── Cookie helpers (client-side) ──────────────────────────────────────────────

function isHttps(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
    isHttps() ? "Secure" : "",
  ].filter(Boolean);
  document.cookie = parts.join("; ");
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${ACCESS_TOKEN_COOKIE}=`;
  const found = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

export interface FrontendSessionInput {
  accessToken: string;
  email: string;
  role: string | null;
  fullName?: string | null;
  picture?: string | null;
  /** Defaults to 1 hour (Supabase default token lifetime). */
  expiresInSeconds?: number;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const found = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

export function getFrontendSessionUser(): FrontendSessionUser | null {
  const email = readCookie(EMAIL_COOKIE);
  const role = readCookie(ROLE_COOKIE);
  const fullName = readCookie(FULL_NAME_COOKIE);
  const picture = readCookie(PICTURE_COOKIE);
  const loggedIn = readCookie(LOGGED_IN_COOKIE) === "true";

  if (!loggedIn && !email && !role && !fullName && !picture) {
    return null;
  }

  return {
    email,
    role,
    fullName,
    picture,
    loggedIn,
  };
}

export function setFrontendSession({
  accessToken,
  email,
  role,
  fullName,
  picture,
  expiresInSeconds = 3600,
}: FrontendSessionInput): void {
  const maxAge = Math.max(60, expiresInSeconds);
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, maxAge);
  setCookie(EMAIL_COOKIE, email, maxAge);
  setCookie(LOGGED_IN_COOKIE, "true", maxAge);
  if (role) setCookie(ROLE_COOKIE, role, maxAge);
  else clearCookie(ROLE_COOKIE);
  if (fullName) setCookie(FULL_NAME_COOKIE, fullName, maxAge);
  else clearCookie(FULL_NAME_COOKIE);
  if (picture) setCookie(PICTURE_COOKIE, picture, maxAge);
  else clearCookie(PICTURE_COOKIE);
}

/**
 * Update specific session cookies without touching the access token.
 *
 * Used after a profile edit so the sidebar/header re-render with the new name, email,
 * or avatar instead of staying on the values captured at login. A custom event is
 * dispatched so any subscriber (SessionActionMenu, AppSidebar) can re-read cookies
 * without a full page reload.
 */
export const SESSION_CHANGED_EVENT = "ehc:session-changed";

export function patchFrontendSession(
  partial: Partial<{
    email: string;
    fullName: string | null;
    picture: string | null;
    role: string | null;
  }>,
): void {
  // 30 days — refreshed pieces shouldn't expire just because we updated them.
  const maxAge = 60 * 60 * 24 * 30;
  if (partial.email !== undefined) setCookie(EMAIL_COOKIE, partial.email, maxAge);
  if (partial.fullName !== undefined) {
    if (partial.fullName) setCookie(FULL_NAME_COOKIE, partial.fullName, maxAge);
    else clearCookie(FULL_NAME_COOKIE);
  }
  if (partial.picture !== undefined) {
    if (partial.picture) setCookie(PICTURE_COOKIE, partial.picture, maxAge);
    else clearCookie(PICTURE_COOKIE);
  }
  if (partial.role !== undefined) {
    if (partial.role) setCookie(ROLE_COOKIE, partial.role, maxAge);
    else clearCookie(ROLE_COOKIE);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
  }
}

export function clearFrontendSession(): void {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
  clearCookie(EMAIL_COOKIE);
  clearCookie(FULL_NAME_COOKIE);
  clearCookie(PICTURE_COOKIE);
  clearCookie(LOGGED_IN_COOKIE);
}
