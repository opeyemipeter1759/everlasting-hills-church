// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { dailyCacheControl } from "@/lib/sermon-digest-proxy";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/word-of-the-day", () => {
  it("passes on the API's Word of the Day", async () => {
    const word = { ready: true, word: "Grace", sermonTitle: "Endued" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(word), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();

    expect(await response.json()).toEqual(word);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/sermon-digest\/word-of-the-day$/);
  });

  it("answers ready: false (not an error) when the API is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ready: false });
  });
});

describe("dailyCacheControl", () => {
  it("never lets the Word of the Day be cached past Lagos midnight", () => {
    // 23:58:30 in Lagos: 90 seconds before the confession changes.
    expect(dailyCacheControl(new Date("2026-09-25T22:58:30Z"))).toBe("public, max-age=60, s-maxage=90, stale-while-revalidate=60");
    expect(dailyCacheControl(new Date("2026-09-25T11:00:00Z"))).toBe("public, max-age=60, s-maxage=300, stale-while-revalidate=60");
  });
});
