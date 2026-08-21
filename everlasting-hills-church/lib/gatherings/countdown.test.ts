import { describe, expect, it } from "vitest";
import {
  formatLeadTime,
  formatOccurrenceDay,
  formatOccurrenceTime,
  formatTimeRemaining,
} from "./countdown";

const NOW = new Date("2026-08-19T10:00:00.000Z");
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatLeadTime", () => {
  it("counts minutes under an hour", () => {
    expect(formatLeadTime(at(25 * MINUTE), NOW)).toBe("in 25 min");
  });

  it("counts hours under a day, singular at one", () => {
    expect(formatLeadTime(at(HOUR), NOW)).toBe("in 1 hour");
    expect(formatLeadTime(at(3 * HOUR), NOW)).toBe("in 3 hours");
  });

  it("says tomorrow rather than 'in 1 days'", () => {
    expect(formatLeadTime(at(DAY), NOW)).toBe("tomorrow");
    expect(formatLeadTime(at(3 * DAY), NOW)).toBe("in 3 days");
  });

  it("collapses the last minute rather than counting seconds", () => {
    expect(formatLeadTime(at(30_000), NOW)).toBe("in under a minute");
  });

  it("reports a past instant as now, never as a negative", () => {
    // Server data is up to a minute stale, so this case is reachable.
    expect(formatLeadTime(at(-5 * MINUTE), NOW)).toBe("now");
    expect(formatLeadTime(at(0), NOW)).toBe("now");
  });

  it("returns nothing for an unparseable instant", () => {
    expect(formatLeadTime("not a date", NOW)).toBe("");
  });
});

describe("formatTimeRemaining", () => {
  it("counts minutes left", () => {
    expect(formatTimeRemaining(at(45 * MINUTE), NOW)).toBe("45 min left");
  });

  it("counts hours and minutes left", () => {
    expect(formatTimeRemaining(at(HOUR + 20 * MINUTE), NOW)).toBe("1 hr 20 min left");
    expect(formatTimeRemaining(at(2 * HOUR), NOW)).toBe("2 hr left");
  });

  it("softens the final stretch instead of counting down", () => {
    expect(formatTimeRemaining(at(3 * MINUTE), NOW)).toBe("ends soon");
  });

  it("renders nothing once the end has passed", () => {
    // Stale data must degrade to silence, not to "-3 min left".
    expect(formatTimeRemaining(at(-3 * MINUTE), NOW)).toBe("");
  });
});

describe("formatOccurrenceTime", () => {
  it("renders the clock time in the gathering's zone, not the browser's", () => {
    // 04:30Z is 05:30 in Lagos — the time the meeting is actually called for.
    expect(formatOccurrenceTime("2026-08-19T04:30:00.000Z", "Africa/Lagos")).toBe("5:30 AM");
  });

  it("renders a different zone correctly", () => {
    expect(formatOccurrenceTime("2026-08-19T04:30:00.000Z", "Europe/London")).toBe("5:30 AM");
    expect(formatOccurrenceTime("2026-08-19T04:30:00.000Z", "UTC")).toBe("4:30 AM");
  });

  it("falls back to the browser zone rather than rendering nothing", () => {
    expect(formatOccurrenceTime("2026-08-19T04:30:00.000Z", "Mars/Olympus_Mons")).not.toBe("");
  });

  it("returns nothing for an unparseable instant", () => {
    expect(formatOccurrenceTime("not a date", "Africa/Lagos")).toBe("");
  });
});

describe("formatOccurrenceDay", () => {
  it("labels the current local day as Today", () => {
    expect(formatOccurrenceDay("2026-08-19T20:00:00.000Z", "Africa/Lagos", NOW)).toBe("Today");
  });

  it("labels the next local day as Tomorrow", () => {
    expect(formatOccurrenceDay("2026-08-20T04:30:00.000Z", "Africa/Lagos", NOW)).toBe("Tomorrow");
  });

  it("compares days in the gathering's zone, not in UTC", () => {
    // 23:30Z on the 19th is already the 20th in Lagos, so relative to a 10:00Z
    // "now" on the 19th this is Tomorrow — a UTC comparison would say Today.
    expect(formatOccurrenceDay("2026-08-19T23:30:00.000Z", "Africa/Lagos", NOW)).toBe("Tomorrow");
  });

  it("falls back to a dated label further out", () => {
    expect(formatOccurrenceDay("2026-08-25T04:30:00.000Z", "Africa/Lagos", NOW)).toContain("25");
  });

  it("returns nothing for an unparseable instant", () => {
    expect(formatOccurrenceDay("not a date", "Africa/Lagos", NOW)).toBe("");
  });
});
