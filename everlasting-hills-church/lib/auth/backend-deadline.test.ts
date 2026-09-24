// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendTimeoutError, fetchBackendWithin, isBackendTimeout } from "./backend-deadline";

/** A fetch that never answers until it is aborted. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      }),
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchBackendWithin", () => {
  it("gives up at its own cap and says it timed out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hangingFetch());
    const pending = fetchBackendWithin("/auth/me", {}, { deadline: Date.now() + 20_000, maxMs: 5_000 });
    const caught = pending.catch((e) => e);
    await vi.advanceTimersByTimeAsync(5_000);
    const error = await caught;
    expect(isBackendTimeout(error)).toBe(true);
  });

  it("never waits past the request's shared deadline", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hangingFetch());
    const caught = fetchBackendWithin("/auth/refresh", {}, { deadline: Date.now() + 2_000, maxMs: 15_000 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await caught).toBeInstanceOf(BackendTimeoutError);
  });

  it("does not even start once the budget is spent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchBackendWithin("/nav-permissions", {}, { deadline: Date.now() - 1, maxMs: 5_000 })).rejects.toBeInstanceOf(
      BackendTimeoutError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes through a normal answer and a real network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(fetchBackendWithin("/auth/me", {}, { deadline: Date.now() + 5_000, maxMs: 5_000 })).resolves.toHaveProperty("status", 200);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const error = await fetchBackendWithin("/auth/me", {}, { deadline: Date.now() + 5_000, maxMs: 5_000 }).catch((e) => e);
    expect(error).toBeInstanceOf(TypeError);
  });
});
