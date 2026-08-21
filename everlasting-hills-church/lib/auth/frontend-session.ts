import {
  ACCESS_TOKEN_COOKIE,
  EMAIL_COOKIE,
  FULL_NAME_COOKIE,
  LOGGED_IN_COOKIE,
  LOGOUT_PENDING_COOKIE,
  PICTURE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ROLE_COOKIE,
} from "./session-constants";

export {
  ACCESS_TOKEN_COOKIE,
  EMAIL_COOKIE,
  FULL_NAME_COOKIE,
  LOGGED_IN_COOKIE,
  LOGOUT_PENDING_COOKIE,
  PICTURE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ROLE_COOKIE,
} from "./session-constants";

export type UserRole =
  | "SUPER_ADMIN"
  | "PASTOR"
  | "ADMIN"
  | "ADMIN_HEAD"
  | "HOD"
  | "HEAD_USHER"
  | "UNIT_LEAD"
  | "MEMBER";

// This hierarchy is only a frontend routing convenience. Nest authorization is
// authoritative and additionally enforces assignment/department scope.
const ROLE_LEVELS: Record<UserRole, number> = {
  MEMBER: 1,
  UNIT_LEAD: 2,
  HEAD_USHER: 3,
  HOD: 4,
  ADMIN_HEAD: 6,
  ADMIN: 6,
  PASTOR: 7,
  SUPER_ADMIN: 8,
};

const CHURCH_WIDE_ROLES = new Set<UserRole>([
  "ADMIN",
  "ADMIN_HEAD",
  "PASTOR",
  "SUPER_ADMIN",
]);
const LATERAL_ROLES = new Set<UserRole>(["HOD", "HEAD_USHER"]);

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
  { label: "Head Usher", value: "head usher" },
  { label: "Admin Head", value: "admin head" },
  { label: "Admin", value: "admin" },
  { label: "Pastor", value: "pastor" },
  { label: "Super Admin", value: "superadmin" },
] as const;

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;

  const cleaned = role.trim().toLowerCase();
  if (cleaned === "member") return "MEMBER";
  if (cleaned === "leader" || cleaned === "unit head" || cleaned === "unit_head") return "UNIT_LEAD";
  if (cleaned === "head usher" || cleaned === "head_usher" || cleaned === "headusher") return "HEAD_USHER";
  if (cleaned === "admin head" || cleaned === "admin_head" || cleaned === "adminhead") return "ADMIN_HEAD";
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
  if (LATERAL_ROLES.has(minRole)) {
    return normalized === minRole || CHURCH_WIDE_ROLES.has(normalized);
  }
  if (LATERAL_ROLES.has(normalized)) {
    // Lateral assignments include normal member access plus only their named
    // capability. HOD/Head Usher must not inherit generic Unit Lead routes.
    return minRole === "MEMBER";
  }
  return ROLE_LEVELS[normalized] >= ROLE_LEVELS[minRole];
}

export function hasAnyMinRole(
  userRoles: ReadonlyArray<string | null | undefined>,
  minRole: UserRole,
): boolean {
  return userRoles.some((role) => hasMinRole(role, minRole));
}

export function getLandingPage(role: string | null | undefined): string {
  return normalizeRole(role) ? "/dashboard" : "/login";
}

/**
 * Ordered from most specific to least specific. The list covers both canonical
 * filesystem routes and the shorter URLs currently used by dashboard nav.
 */
export const ROUTE_ROLE_RULES: ReadonlyArray<readonly [string, UserRole]> = [
  ["/dashboard/audit-log", "SUPER_ADMIN"],
  ["/dashboard/admin/roles", "ADMIN"],
  ["/dashboard/admin/attendance/ushers-report", "HEAD_USHER"],
  ["/dashboard/admin/usher", "HEAD_USHER"],
  ["/dashboard/my-department/reports", "ADMIN_HEAD"],
  ["/dashboard/my-department", "HOD"],
  ["/dashboard/unit-lead", "UNIT_LEAD"],
  ["/dashboard/analytics/departments", "UNIT_LEAD"],
  ["/dashboard/cms", "PASTOR"],
  ["/dashboard/sermons", "PASTOR"],
  ["/dashboard/subscribers", "PASTOR"],
  ["/dashboard/alerts", "PASTOR"],
  ["/dashboard/reports", "PASTOR"],
  ["/dashboard/giving", "PASTOR"],
  ["/dashboard/analytics/engagement", "PASTOR"],
  ["/dashboard/analytics/giving", "PASTOR"],
  ["/dashboard/pastor", "PASTOR"],
  ["/dashboard/members", "ADMIN"],
  ["/dashboard/first-timers", "ADMIN"],
  ["/dashboard/services", "ADMIN"],
  ["/dashboard/events", "ADMIN"],
  ["/dashboard/announcements", "ADMIN"],
  ["/dashboard/units", "ADMIN"],
  ["/dashboard/analytics/attendance", "ADMIN"],
  ["/dashboard/analytics/growth", "ADMIN"],
  ["/dashboard/analytics/first-timers", "ADMIN"],
  ["/dashboard/analytics", "ADMIN"],
  ["/dashboard/prayer-requests", "ADMIN"],
  ["/dashboard/testimonies", "ADMIN"],
  ["/dashboard/questions", "ADMIN"],
  ["/dashboard/settings/homepage", "ADMIN"],
  ["/dashboard/admin", "ADMIN"],
  ["/dashboard/follow-up", "MEMBER"],
  ["/dashboard", "MEMBER"],
  ["/me", "MEMBER"],
  ["/admin", "SUPER_ADMIN"],
];

export function getRequiredRole(pathname: string): UserRole | null {
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  for (const [prefix, role] of ROUTE_ROLE_RULES) {
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

function isHttps(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
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

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
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

  if (!loggedIn && !email && !role && !fullName && !picture) return null;
  return { email, role, fullName, picture, loggedIn };
}

export const SESSION_CHANGED_EVENT = "ehc:session-changed";
export const SESSION_CLEARED_EVENT = "ehc:session-cleared";
export const AUTH_ERROR_EVENT = "ehc:auth-error";

export function notifyFrontendSessionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
  }
}

export function markLogoutPending(): void {
  // Persists as long as a refresh session could. Middleware treats this only as
  // a request to destroy credentials, never as proof of identity/authorization.
  setCookie(LOGOUT_PENDING_COOKIE, "1", 60 * 60 * 24 * 30);
}

export function patchFrontendSession(
  partial: Partial<{
    email: string;
    fullName: string | null;
    picture: string | null;
    role: string | null;
  }>,
): void {
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
  notifyFrontendSessionChanged();
}

export function clearFrontendSession(): void {
  // The first two calls clean up legacy, JavaScript-readable cookies. Current
  // token cookies are HttpOnly and are cleared by the logout route response.
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
  clearCookie(EMAIL_COOKIE);
  clearCookie(FULL_NAME_COOKIE);
  clearCookie(PICTURE_COOKIE);
  clearCookie(LOGGED_IN_COOKIE);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
    window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT));
  }
}
