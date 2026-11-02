import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("BFF auth method gate", () => {
  it.each(["login", "refresh", "logout"])("rejects GET /auth/%s without touching Nest", async (action) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest(`https://church.test/api/backend/auth/${action}`, {
      headers: { cookie: "ehc_access_token=secret; ehc_refresh_token=refresh-secret" },
    });

    const response = await GET(request, { params: { path: ["auth", action] } });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("BFF CSRF check", () => {
  it("allows same-origin browser requests when the reverse proxy changes the request origin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid email or password" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("https://internal.example/api/backend/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://church.test",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({ email: "member@example.test", password: "invalid" }),
    });

    const response = await POST(request, { params: { path: ["auth", "login"] } });

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
