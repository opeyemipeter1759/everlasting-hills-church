import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  accessTokenNeedsRefresh,
  clearSessionCookies,
  getBackendSession,
  getJwtExpiration,
  withoutSessionTokens,
} from "./server-session";
import { LOGOUT_PENDING_COOKIE, isLogoutPending } from "./session-constants";

function unsignedJwt(exp: number): string {
  const payload = btoa(JSON.stringify({ exp })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${payload}.signature`;
}

describe("server session boundary", () => {
  const envelope = {
    data: {
      access_token: "access-secret",
      refresh_token: "refresh-secret",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "u1", email: "u@example.com", role: "MEMBER", fullName: null, picture: null },
    },
  };

  it("extracts credentials server-side and strips them from the browser response", () => {
    expect(getBackendSession(envelope)?.access_token).toBe("access-secret");
    expect(withoutSessionTokens(envelope)).toEqual({
      data: {
        expires_in: 3600,
        token_type: "bearer",
        user: { id: "u1", email: "u@example.com", role: "MEMBER", fullName: null, picture: null },
      },
    });
  });

  it("proactively refreshes missing, malformed, and nearly-expired tokens", () => {
    expect(accessTokenNeedsRefresh(null, 100)).toBe(true);
    expect(accessTokenNeedsRefresh("not-a-jwt", 100)).toBe(true);
    expect(accessTokenNeedsRefresh(unsignedJwt(125), 100)).toBe(true);
    expect(accessTokenNeedsRefresh(unsignedJwt(131), 100)).toBe(false);
    expect(getJwtExpiration(unsignedJwt(131))).toBe(131);
  });

  it("clears a pending offline-logout marker with the rest of the server session", () => {
    const response = NextResponse.json({ ok: true });
    clearSessionCookies(response);

    expect(response.cookies.get(LOGOUT_PENDING_COOKIE)?.value).toBe("");
    expect(isLogoutPending("1")).toBe(true);
    expect(isLogoutPending(undefined)).toBe(false);
  });
});
