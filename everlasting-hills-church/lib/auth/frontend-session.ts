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
    pathname.startsWith("/dashboard/first-timers") ||
    pathname.startsWith("/dashboard/services") ||
    pathname.startsWith("/dashboard/events") ||
    pathname.startsWith("/dashboard/submissions") ||
    pathname.startsWith("/dashboard/announcements") ||
    pathname.startsWith("/dashboard/inventory") ||
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/analytics/attendance") ||
    pathname.startsWith("/dashboard/analytics/growth") ||
    pathname.startsWith("/dashboard/analytics/first-timers")
  ) {
    return "ADMIN";
  }

  if (pathname.startsWith("/dashboard/units") || pathname.startsWith("/dashboard/analytics/departments")) {
    return "UNIT_LEAD";
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/me") || pathname === "/change-password") {
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
  /** Defaults to 1 hour (Supabase default token lifetime). */
  expiresInSeconds?: number;
}

export function setFrontendSession({ accessToken, email, role, expiresInSeconds = 3600 }: FrontendSessionInput): void {
  const maxAge = Math.max(60, expiresInSeconds);
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, maxAge);
  setCookie(EMAIL_COOKIE, email, maxAge);
  setCookie(LOGGED_IN_COOKIE, "true", maxAge);
  if (role) setCookie(ROLE_COOKIE, role, maxAge);
  else clearCookie(ROLE_COOKIE);
}

export function clearFrontendSession(): void {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
  clearCookie(EMAIL_COOKIE);
  clearCookie(LOGGED_IN_COOKIE);
}
