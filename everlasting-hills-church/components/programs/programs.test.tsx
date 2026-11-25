import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgramCard as Program } from "@/lib/programs";
import { liveNow, whenText } from "./live";
import { ProgramCard } from "./ProgramCard";
import { ProgramGroups } from "./ProgramGroups";
import { RhythmStrip } from "./RhythmStrip";

afterEach(cleanup);

// Monday 23 November 2026, 22:00 to 06:00 Lagos (21:00 to 05:00 UTC).
const watchNight = {
  start: "2026-11-23T21:00:00.000Z",
  end: "2026-11-24T05:00:00.000Z",
  label: null,
  sessions: [
    { name: "The Seers", start: "2026-11-23T21:00:00.000Z", end: "2026-11-23T23:00:00.000Z" },
    { name: "The Watch-House", start: "2026-11-23T23:00:00.000Z", end: "2026-11-24T01:00:00.000Z" },
  ],
};
const base: Program = {
  slug: "prayer-watch",
  name: "Prayer Watch",
  nameStatus: "FINAL",
  eyebrow: "WEEKLY WATCH · MON TUE THU FRI SAT",
  shortDescription: "Watchmen on the walls.",
  programType: "PRAYER",
  cadence: "WEEKLY",
  format: "HYBRID",
  accent: "BURGUNDY",
  logoUrl: null,
  coverUrl: null,
  ctaLabel: "Join a watch",
  ctaUrl: "/prayer-watch",
  featured: true,
  dateStatus: "CONFIRMED",
  schedule: "Every Monday, Tuesday, Thursday, Friday and Saturday night, 10:00 PM to 6:00 AM WAT",
  nextOccurrence: { start: watchNight.start, end: watchNight.end, label: null },
  isLiveNow: false,
  liveSession: null,
  occurrences: [watchNight],
  scriptures: [{ reference: "Isaiah 62:6-7", text: "I have set watchmen", translation: "WEB", status: "CONFIRMED" }],
};
const homecoming: Program = {
  ...base,
  slug: "homecoming-conference",
  name: "Homecoming Conference",
  nameStatus: "PROVISIONAL",
  cadence: "ANNUAL",
  programType: "CONFERENCE",
  dateStatus: "TBA",
  schedule: "April. Date to be announced",
  nextOccurrence: null,
  occurrences: [],
  scriptures: [],
};
const midnight = new Date("2026-11-23T23:30:00Z"); // 00:30 Tuesday in Lagos
const morning = new Date("2026-11-23T09:00:00Z"); // 10:00 Monday in Lagos

describe("a program card", () => {
  it("shows Live and the watch that is on, while it is on", () => {
    render(<ProgramCard program={base} now={midnight} />);
    expect(screen.getByRole("status").textContent).toContain("Live");
    expect(screen.getByText("On now: The Watch-House")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/programs/prayer-watch");
  });

  it("shows when it is next, with no Live badge, before it starts", () => {
    render(<ProgramCard program={base} now={morning} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Tonight at 10:00 PM")).toBeTruthy();
    expect(screen.getByText("Isaiah 62:6-7")).toBeTruthy();
  });

  it("says when a date is still to be announced, marks a working name, and copes with no scripture", () => {
    render(<ProgramCard program={homecoming} now={morning} />);
    expect(screen.getByText("April. Date to be announced")).toBeTruthy();
    expect(screen.getByText("Working name, to be confirmed")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Homecoming Conference");
    expect(screen.getByRole("link").textContent).not.toMatch(/undefined|null/);
  });
});

describe("the rhythm of the house", () => {
  it("puts what is live first, then what is next, then what is to be announced", () => {
    // The strip moves to the real clock after its first render; pin the clock to the watch.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(midnight);
    try {
      render(<RhythmStrip programs={[homecoming, base]} />);
      const items = within(screen.getByRole("list")).getAllByRole("link").map((a) => a.textContent);
      expect(items).toEqual(["Prayer Watch is live. The Watch-House is on now", "Homecoming Conference: April. Date to be announced"]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the programs page body", () => {
  it("groups programs by cadence, and invites people elsewhere when there are none", () => {
    render(<ProgramGroups programs={[homecoming, base]} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Weekly", "Annual"]);
    cleanup();
    render(<ProgramGroups programs={[]} />);
    expect(screen.getByText("No programs are published yet")).toBeTruthy();
  });
});

describe("live and next, from the server's windows", () => {
  it("knows the watch on now and words the next start in Lagos time", () => {
    expect(liveNow(base, midnight)).toMatchObject({ live: true, session: "The Watch-House" });
    expect(liveNow(base, morning).live).toBe(false);
    expect(whenText(new Date(watchNight.start), morning)).toBe("Tonight at 10:00 PM");
    expect(whenText(new Date("2026-11-24T21:00:00Z"), morning)).toBe("Tomorrow at 10:00 PM");
    expect(whenText(new Date("2026-11-26T21:00:00Z"), morning)).toBe("Thursday at 10:00 PM");
    expect(whenText(new Date("2026-11-30T21:00:00Z"), morning)).toBe("In 7 days");
    expect(whenText(new Date("2027-01-31T21:00:00Z"), morning)).toBe("On 31 January");
  });
});
