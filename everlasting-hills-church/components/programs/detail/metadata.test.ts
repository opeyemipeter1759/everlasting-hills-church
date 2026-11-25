import { describe, expect, it } from "vitest";
import { navLinks } from "@/components/home/navbar/nav-links";
import type { ProgramDetail } from "@/lib/programs";
import { eventsFor } from "./ProgramJsonLd";

const base: ProgramDetail = {
  slug: "prayer-watch", name: "Prayer Watch", nameStatus: "FINAL", eyebrow: "WEEKLY WATCH", shortDescription: "Watchmen on the walls.", programType: "PRAYER",
  cadence: "WEEKLY", format: "HYBRID", accent: "BURGUNDY", logoUrl: null, coverUrl: null, ctaLabel: null, ctaUrl: null, featured: true, dateStatus: "CONFIRMED",
  schedule: "Every Monday", nextOccurrence: null, isLiveNow: false, liveSession: null, scriptures: [],
  occurrences: [{ start: "2026-11-23T21:00:00.000Z", end: "2026-11-24T05:00:00.000Z", label: null, sessions: [] }],
  longDescription: null, venue: null, streamUrl: null, timezone: "Africa/Lagos", sessions: [], editions: { upcoming: [], archive: [] },
};

describe("the main menu", () => {
  it("lists Programs right after Sermons", () => {
    const media = navLinks.find((l) => l.id === "media")!;
    const labels = media.children!.map((c) => c.label);
    expect(labels.indexOf("Programs")).toBe(labels.indexOf("Sermons") + 1);
    expect(media.children!.find((c) => c.label === "Programs")!.href).toBe("/programs");
  });
});

describe("search engine events", () => {
  it("describes confirmed dates as schema.org Events, in person and online", () => {
    const [event] = eventsFor(base);
    expect(event).toMatchObject({ "@type": "Event", name: "Prayer Watch", startDate: "2026-11-23T21:00:00.000Z", eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode" });
  });

  it("produces nothing for a program whose date is still to be announced", () => {
    expect(eventsFor({ ...base, dateStatus: "TBA", occurrences: [] })).toEqual([]);
  });
});
