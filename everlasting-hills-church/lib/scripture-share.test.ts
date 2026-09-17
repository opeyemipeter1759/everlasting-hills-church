import { describe, expect, it } from "vitest";
import { SCRIPTURE_THEMES, scriptureThemeFor } from "./scripture-share";

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
