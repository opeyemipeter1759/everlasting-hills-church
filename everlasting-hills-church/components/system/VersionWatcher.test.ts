import { afterEach, describe, expect, it, vi } from "vitest";

const reply = (build: string | null, ok = true) => vi.fn(async () => ({ ok, json: async () => ({ build }) })) as unknown as typeof fetch;

describe("spotting a new deploy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is true only when the server runs a different build", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_ID", "build-1");
    const { newerBuildOut } = await import("./VersionWatcher");
    expect(await newerBuildOut(reply("build-1"))).toBe(false);
    expect(await newerBuildOut(reply("build-2"))).toBe(true);
  });

  it("never reloads on a failed or empty answer", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_ID", "build-1");
    const { newerBuildOut } = await import("./VersionWatcher");
    expect(await newerBuildOut(reply("build-2", false))).toBe(false);
    expect(await newerBuildOut(reply(null))).toBe(false);
    expect(await newerBuildOut(vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch)).toBe(false);
  });
});
