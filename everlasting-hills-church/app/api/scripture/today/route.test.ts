// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const request = (query = "") => new NextRequest(`http://localhost/api/scripture/today${query}`);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/scripture/today", () => {
  it("still gives visitors today's scripture when the API refuses them", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { statusCode: 401, message: "Unauthorized" } }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("?translation=KJV"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-scripture-source")).toBe("bundled");
    expect(body).toMatchObject({ translationCode: "KJV", translationName: "King James Version" });
    expect(body.text.length).toBeGreaterThan(0);
    // Asked without the visitor's credentials.
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("authorization");
  });

  it("serves the API's answer when the API has one", async () => {
    const scripture = {
      date: "2026-09-16",
      timezone: "Africa/Lagos",
      reference: "1 Peter 2:9",
      text: "But you are a chosen race…",
      translationCode: "WEB",
      translationName: "World English Bible",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: scripture, meta: {} }), { status: 200 })),
    );

    const response = await GET(request());

    expect(response.headers.get("x-scripture-source")).toBe("api");
    await expect(response.json()).resolves.toEqual(scripture);
  });

  it("explains an unavailable version in words a reader understands", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await GET(request("?translation=NIV"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { message: "That Bible version isn't available. Choose another version." },
    });
  });
});
