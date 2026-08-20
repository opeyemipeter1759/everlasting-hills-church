import type { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  EMAIL_COOKIE,
  FULL_NAME_COOKIE,
  LOGGED_IN_COOKIE,
  LOGOUT_PENDING_COOKIE,
  PICTURE_COOKIE,
  REFRESH_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  ROLE_COOKIE,
} from "./session-constants";

export interface BackendSessionUser {
  id: string;
  email: string;
  role: string | null;
  fullName: string | null;
  picture: string | null;
  needsPasswordChange?: boolean;
}

export interface BackendSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user: BackendSessionUser;
}

type CookieResponse = Pick<NextResponse, "cookies">;

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const UI_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: REFRESH_MAX_AGE_SECONDS,
};

export const ALL_SESSION_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ROLE_COOKIE,
  EMAIL_COOKIE,
  FULL_NAME_COOKIE,
  PICTURE_COOKIE,
  LOGGED_IN_COOKIE,
  LOGOUT_PENDING_COOKIE,
] as const;

export function unwrapBackendPayload(value: unknown): unknown {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: unknown }).data;
  }
  return value;
}

export function getBackendSession(value: unknown): BackendSession | null {
  const candidate = unwrapBackendPayload(value);
  if (!candidate || typeof candidate !== "object") return null;
  const session = candidate as Partial<BackendSession>;
  if (
    typeof session.access_token !== "string" ||
    !session.access_token ||
    !session.user ||
    typeof session.user !== "object"
  ) {
    return null;
  }
  return session as BackendSession;
}

/** Remove credentials while preserving the backend's response-envelope shape. */
export function withoutSessionTokens(value: unknown): unknown {
  const strip = (candidate: unknown): unknown => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return candidate;
    const { access_token: _access, refresh_token: _refresh, ...safe } = candidate as Record<string, unknown>;
    return safe;
  };

  if (value && typeof value === "object" && "data" in value) {
    return { ...(value as Record<string, unknown>), data: strip((value as { data: unknown }).data) };
  }
  return strip(value);
}

export function setSessionCookies(response: CookieResponse, session: BackendSession): void {
  const accessMaxAge = Math.max(1, Math.floor(session.expires_in ?? 60 * 60));
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...TOKEN_COOKIE_OPTIONS,
    maxAge: accessMaxAge,
  });
  if (session.refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
      ...TOKEN_COOKIE_OPTIONS,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }

  response.cookies.set(LOGGED_IN_COOKIE, "true", UI_COOKIE_OPTIONS);
  setOptionalUiCookie(response, EMAIL_COOKIE, session.user.email);
  setOptionalUiCookie(response, ROLE_COOKIE, session.user.role);
  setOptionalUiCookie(response, FULL_NAME_COOKIE, session.user.fullName);
  setOptionalUiCookie(response, PICTURE_COOKIE, session.user.picture);
}

function setOptionalUiCookie(
  response: CookieResponse,
  name: string,
  value: string | null | undefined,
): void {
  if (value) response.cookies.set(name, value, UI_COOKIE_OPTIONS);
  else deleteCookie(response, name);
}

function deleteCookie(response: CookieResponse, name: string): void {
  response.cookies.set(name, "", {
    httpOnly: name === ACCESS_TOKEN_COOKIE || name === REFRESH_TOKEN_COOKIE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function clearSessionCookies(response: CookieResponse): void {
  for (const name of ALL_SESSION_COOKIE_NAMES) deleteCookie(response, name);
}

/** Decode only `exp` for proactive refresh. Authorization still happens in Nest. */
export function getJwtExpiration(token: string | null | undefined): number | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

export function accessTokenNeedsRefresh(
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const expiration = getJwtExpiration(token);
  return !expiration || expiration <= nowSeconds + 30;
}
