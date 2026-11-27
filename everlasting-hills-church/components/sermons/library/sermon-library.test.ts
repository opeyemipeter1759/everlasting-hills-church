import { describe, expect, it } from "vitest";
import type { LatestSermon } from "@/types";
import { NO_FILTERS, applyFilters, cleanText, clockDuration, libraryOptions, speakerName } from "./sermon-library";

const sermon = (over: Partial<LatestSermon>): LatestSermon =>
  ({ id: over.slug ?? "x", slug: "x", title: "Title", speaker: "Pastor Opeyemi Peter", date: "2026-11-23T09:00:00Z", publishedAt: "2026-11-23T09:00:00Z",
    series: null, description: null, scriptureRef: null, tags: [], ...over }) as LatestSermon;

const list = [
  sermon({ slug: "a", title: "Strangers &amp; Pilgrims - 3", speaker: "Pastor Opeyemi Peter.", series: "Strangers &amp; Pilgrims", date: "2026-11-24T09:00:00Z" }),
  sermon({ slug: "b", title: "A New Creation", speaker: "Pastor Opeyemi  Peter", series: null, date: "2025-03-02T09:00:00Z" }),
  sermon({ slug: "c", title: "Dominion", speaker: "Min. Sharon Amana", series: "Dominion", date: "2023-06-11T09:00:00Z", description: "Walking in authority" }),
];

describe("sermon library", () => {
  it("shows imported text as written", () => {
    expect(cleanText("Strangers &amp;amp; Pilgrims &#39;26")).toBe("Strangers & Pilgrims '26");
  });

  it("treats spelling variants of one speaker as one, with the right counts", () => {
    expect(speakerName({ speaker: "Pastor Opeyemi  Peter." })).toBe("Pastor Opeyemi Peter");
    const { speakers, years, series } = libraryOptions(list);
    expect(speakers).toEqual([
      { value: "min. sharon amana", label: "Min. Sharon Amana", count: 1 },
      { value: "pastor opeyemi peter", label: "Pastor Opeyemi Peter", count: 2 },
    ]);
    expect(years.map((y) => y.value)).toEqual(["2026", "2025", "2023"]);
    expect(series.map((s) => s.label)).toEqual(["Dominion", "Strangers & Pilgrims"]);
  });

  it("filters by year, speaker, series and words anywhere, and sorts", () => {
    expect(applyFilters(list, { ...NO_FILTERS, year: "2025" }).map((s) => s.slug)).toEqual(["b"]);
    expect(applyFilters(list, { ...NO_FILTERS, speaker: "pastor opeyemi peter" }).map((s) => s.slug)).toEqual(["a", "b"]);
    expect(applyFilters(list, { ...NO_FILTERS, series: "strangers & pilgrims" }).map((s) => s.slug)).toEqual(["a"]);
    expect(applyFilters(list, { ...NO_FILTERS, search: "authority sharon" }).map((s) => s.slug)).toEqual(["c"]);
    expect(applyFilters(list, { ...NO_FILTERS, sort: "oldest" }).map((s) => s.slug)).toEqual(["c", "b", "a"]);
    expect(applyFilters(list, { ...NO_FILTERS, sort: "title" }).map((s) => s.slug)).toEqual(["b", "c", "a"]);
  });

  it("writes lengths like a clock", () => {
    expect(clockDuration(2700)).toBe("45:00");
    expect(clockDuration(5055)).toBe("1:24:15");
    expect(clockDuration(null)).toBeNull();
  });
});
