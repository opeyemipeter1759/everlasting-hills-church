// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

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
