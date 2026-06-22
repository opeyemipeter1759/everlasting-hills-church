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
export const REFRESH_TOKEN_COOKIE = "ehc_refresh_token";
export const ROLE_COOKIE = "ehc_role";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
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
  const normalized = normalizeRole(role);
  if (!normalized) return "/login";
  return normalized === "SUPER_ADMIN" ? "/dashboard" : "/dashboard";
}

export function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) return "SUPER_ADMIN";
  if (pathname.startsWith("/dashboard/admin")) return "ADMIN";
  if (pathname.startsWith("/dashboard/pastor")) return "PASTOR";
  if (pathname.startsWith("/dashboard/unit-leader")) return "UNIT_LEAD";
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/me")) return "MEMBER";
  return null;
}
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

export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${REFRESH_TOKEN_COOKIE}=`;
  const found = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

export interface FrontendSessionInput {
  accessToken: string;
  refreshToken?: string | null;
  email: string;
  role: string | null;
  fullName?: string | null;
  picture?: string | null;
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
  refreshToken,
  email,
  role,
  fullName,
  picture,
}: FrontendSessionInput): void {
  // All cookies live as long as the refresh token (30 days) so the browser never
  // auto-deletes the session mid-use. Actual auth validity is enforced by the backend
  // via JWT signature verification; the cookie lifetime is just a browser-side persistence.
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, REFRESH_MAX_AGE);
  if (refreshToken) setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_MAX_AGE);
  setCookie(EMAIL_COOKIE, email, REFRESH_MAX_AGE);
  setCookie(LOGGED_IN_COOKIE, "true", REFRESH_MAX_AGE);
  if (role) setCookie(ROLE_COOKIE, role, REFRESH_MAX_AGE);
  else clearCookie(ROLE_COOKIE);
  if (fullName) setCookie(FULL_NAME_COOKIE, fullName, REFRESH_MAX_AGE);
  else clearCookie(FULL_NAME_COOKIE);
  if (picture) setCookie(PICTURE_COOKIE, picture, REFRESH_MAX_AGE);
  else clearCookie(PICTURE_COOKIE);
}
export const SESSION_CHANGED_EVENT = "ehc:session-changed";
export const AUTH_ERROR_EVENT = "ehc:auth-error";

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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
  }
}

export function clearFrontendSession(): void {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
  clearCookie(EMAIL_COOKIE);
  clearCookie(FULL_NAME_COOKIE);
  clearCookie(PICTURE_COOKIE);
  clearCookie(LOGGED_IN_COOKIE);
}
