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
  if (!role) {
    return null;
  }

  const cleaned = role.trim().toLowerCase();

  if (cleaned === "member") return "MEMBER";
  if (cleaned === "leader" || cleaned === "unit head" || cleaned === "unit_head") return "UNIT_LEAD";
  if (cleaned === "admin") return "ADMIN";
  if (cleaned === "pastor") return "PASTOR";
  if (cleaned === "superadmin" || cleaned === "super admin" || cleaned === "super_admin") return "SUPER_ADMIN";

  const upper = cleaned.toUpperCase().replace(/\s+/g, "_");
  if (upper in ROLE_LEVELS) {
    return upper as UserRole;
  }

  return null;
}

export function hasMinRole(userRole: string | null | undefined, minRole: UserRole): boolean {
  const normalized = normalizeRole(userRole);
  if (!normalized) {
    return false;
  }

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

export function createFrontendAccessToken(email: string, role: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2);

  return [email.trim().toLowerCase(), role.trim().toLowerCase(), timestamp, randomPart]
    .filter(Boolean)
    .join(".");
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
    secure ? "Secure" : "",
  ].filter(Boolean);

  document.cookie = parts.join("; ");
}

export function setFrontendSession(params: { email: string; role: string; accessToken: string }) {
  const maxAge = 60 * 60 * 24 * 7;

  setCookie(LOGGED_IN_COOKIE, "true", maxAge);
  setCookie(EMAIL_COOKIE, params.email, maxAge);
  setCookie(ROLE_COOKIE, params.role, maxAge);
  setCookie(ACCESS_TOKEN_COOKIE, params.accessToken, maxAge);
}

export function clearFrontendSession() {
  document.cookie = `${LOGGED_IN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${EMAIL_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}