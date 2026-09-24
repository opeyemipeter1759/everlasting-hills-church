import { describe, expect, it } from "vitest";
import { SCRIPTURE_THEMES, scriptureThemeFor, shareCaption } from "./scripture-share";

describe("daily scripture artwork", () => {
  it("uses a different visual treatment on each neighbouring day", () => {
    const dates = Array.from({ length: SCRIPTURE_THEMES.length }, (_, offset) =>
      new Date(Date.UTC(2026, 8, 15 + offset)).toISOString().slice(0, 10),
    );
    const themes = dates.map((date) => scriptureThemeFor(date).key);

    expect(new Set(themes)).toHaveProperty("size", SCRIPTURE_THEMES.length);
    themes.slice(1).forEach((theme, index) => expect(theme).not.toBe(themes[index]));
  });

  it("keeps the design stable when the same day's image is generated again", () => {
    expect(scriptureThemeFor("2026-09-15")).toBe(scriptureThemeFor("2026-09-15"));
  });
});

describe("share captions", () => {
  const scripture = {
    date: "2026-09-24",
    timezone: "Africa/Lagos",
    reference: "Psalm 121:1",
    text: "I will lift up mine eyes unto the hills.",
    translationCode: "KJV",
    translationName: "King James Version",
  };
  const reading = { referenceLabel: "Genesis 1–3", planTitle: "Bible in a Year", dayIndex: 12, durationDays: 365 };

  it("copies the scripture with its version and the church website", () => {
    const text = shareCaption("scripture", scripture, reading);
    expect(text).toContain("I will lift up mine eyes unto the hills.");
    expect(text).toContain("Psalm 121:1 (KJV)");
    expect(text).toContain("everlastinghills.church");
    expect(text).not.toContain("Genesis 1–3");
  });

  it("copies the reading on its own", () => {
    const text = shareCaption("reading", scripture, reading);
    expect(text).toContain("Today's Bible reading: Genesis 1–3");
    expect(text).toContain("Day 12 of 365 · Bible in a Year");
    expect(text).not.toContain("Psalm 121:1");
  });

  it("copies both together", () => {
    const text = shareCaption("both", scripture, reading);
    expect(text).toContain("Psalm 121:1 (KJV)");
    expect(text).toContain("Today's Bible reading: Genesis 1–3");
  });

  it("copies the Hills Confession one line per breath", () => {
    const text = shareCaption("confession", scripture, reading);
    expect(text).toContain("The Hills Confession\n\nI am of the Everlasting Hills.\nI am fruitful.");
    expect(text).toContain("everlastinghills.church");
    expect(text).not.toContain("Psalm 121:1");
  });

  it("falls back to the scripture when there is no reading", () => {
    expect(shareCaption("both", scripture, null)).toBe(shareCaption("scripture", scripture, null));
    expect(shareCaption("reading", scripture, null)).toBe("");
  });
});
