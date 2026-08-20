import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/session-constants";

const { verifyJwtMock } = vi.hoisted(() => ({ verifyJwtMock: vi.fn() }));
vi.mock("@/lib/auth/verify-jwt", () => ({ verifySupabaseJwt: verifyJwtMock }));

import { POST } from "./route";

describe("password recovery cookie exchange", () => {
  it("clears a previous user's refresh cookie before setting recovery access", async () => {
    verifyJwtMock.mockResolvedValue({ sub: "recovery-user", exp: 2_000_000_000, iat: 1 });
    const request = new NextRequest("https://church.test/api/auth/recovery", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://church.test",
        cookie: `${REFRESH_TOKEN_COOKIE}=previous-user-secret`,
      },
      body: JSON.stringify({ accessToken: "recovery.jwt.value" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE)?.value).toBe("");
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)?.value).toBe("recovery.jwt.value");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${ACCESS_TOKEN_COOKIE}=recovery.jwt.value`);
    expect(setCookie).toContain("HttpOnly");
  });
});

