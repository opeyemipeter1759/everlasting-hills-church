import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

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

