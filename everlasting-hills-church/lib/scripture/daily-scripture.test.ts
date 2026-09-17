// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import data from "@/data/daily-scripture.json";
import {
  bundledDailyScripture,
  resolveDailyScripture,
  resolveScriptureTranslations,
  rotationIndex,
  scriptureDate,
} from "./daily-scripture";

const apiAnswer = {
  date: "2026-09-16",
  timezone: "Africa/Lagos",
  reference: "1 Peter 2:9",
  text: "But you are a chosen race, a royal priesthood…",
  translationCode: "WEB",
  translationName: "World English Bible",
};

describe("the website's own copy of the daily scripture", () => {
  it("gives the verse the API gives for the same day, in either version", () => {
    const web = bundledDailyScripture("2026-09-16");
    const kjv = bundledDailyScripture("2026-09-16", "kjv");

    expect(web).toMatchObject({ reference: "1 Peter 2:9", translationCode: "WEB", translationName: "World English Bible" });
    expect(web?.text).toMatch(/^But you are a chosen race/);
    expect(kjv).toMatchObject({ reference: "1 Peter 2:9", translationCode: "KJV", translationName: "King James Version" });
    expect(kjv?.text).toMatch(/^But ye are a chosen generation/);
  });

  it("changes at midnight in Lagos, not at midnight on the server", () => {
    // 23:30 UTC is already 00:30 the next day in Lagos.
    expect(scriptureDate(new Date("2026-09-16T23:30:00Z"))).toBe("2026-09-17");
    expect(scriptureDate(new Date("2026-09-16T22:30:00Z"))).toBe("2026-09-16");
  });

  it("never repeats a verse on neighbouring days and wraps before the rotation began", () => {
    expect(bundledDailyScripture("2026-09-17")?.reference).not.toBe(bundledDailyScripture("2026-09-16")?.reference);
    expect(rotationIndex("2025-12-31")).toBe(data.verses.length - 1);
  });

  it("has no answer for a version it doesn't carry", () => {
    expect(bundledDailyScripture("2026-09-16", "NIV")).toBeNull();
  });

  it("follows the API's rotation exactly", () => {
    const source = resolve(process.cwd(), "../ehc-backend/src/reading-plan/verse-of-the-day.ts");
    if (!existsSync(source)) return; // Only the monorepo checkout carries the API.
    const file = readFileSync(source, "utf8");
    const list = file.slice(file.indexOf("DAILY_VERSES"), file.indexOf("];", file.indexOf("DAILY_VERSES")));
    const apiRefs = Array.from(list.matchAll(/\[(\d+), (\d+), (\d+)(?:, (\d+))?\]/g), (match) =>
      match.slice(1).filter(Boolean).map(Number),
    );

    expect(file).toContain(`ROTATION_START = '${data.rotationStart}'`);
    // If this fails, rerun ehc-backend/scripts/export-daily-scripture.ts.
    expect(data.verses.map((verse) => verse.ref)).toEqual(apiRefs);
  });
});

describe("answering today's scripture", () => {
  it("uses the API's answer when it gives one", async () => {
    const read = vi.fn().mockResolvedValue(apiAnswer);

    await expect(resolveDailyScripture(read, "WEB")).resolves.toEqual({ value: apiAnswer, source: "api" });
    expect(read).toHaveBeenCalledWith("/bible/today?translation=WEB");
  });

  it.each([
    ["refuses (an older API that wants a sign-in)", () => Promise.resolve(null)],
    ["is unreachable or too slow", () => Promise.reject(new Error("aborted"))],
    ["answers with something that isn't a scripture", () => Promise.resolve({ message: "Cannot GET /bible/today" })],
  ])("answers from the bundled copy when the API %s", async (_case, reader) => {
    const result = await resolveDailyScripture(reader, "KJV", new Date("2026-09-16T08:00:00Z"));

    expect(result?.source).toBe("bundled");
    expect(result?.value).toMatchObject({ date: "2026-09-16", reference: "1 Peter 2:9", translationCode: "KJV" });
  });

  it("offers the bundled versions when the API can't list them", async () => {
    const result = await resolveScriptureTranslations(() => Promise.resolve(null));

    expect(result.source).toBe("bundled");
    expect(result.value.map((version) => version.code)).toEqual(["WEB", "KJV"]);
  });

  it("passes on only the fields a version needs from the API's list", async () => {
    const result = await resolveScriptureTranslations(() =>
      Promise.resolve([{ id: 1, code: "WEB", name: "World English Bible", licence: "Public domain", isDefault: true }]),
    );

    expect(result).toEqual({ source: "api", value: [{ code: "WEB", name: "World English Bible", isDefault: true }] });
  });
});
