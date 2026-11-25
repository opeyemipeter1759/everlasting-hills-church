import { describe, expect, it } from "vitest";
import { formatEventDateRange, getEventStatus, getEventTiming } from "./event-format";

const TZ = "Africa/Lagos"; // UTC+1, no DST
const at = (iso: string) => new Date(iso);

describe("event date formatting", () => {
  it("formats a multi-day event in its configured timezone", () => {
    expect(formatEventDateRange("2026-10-01T23:00:00.000Z", "2026-10-31T22:59:59.000Z", TZ)).toBe("2–31 Oct 2026");
  });
});

describe("event status uses date and time", () => {
  const oneOff = { startAt: "2026-12-12T09:00:00.000Z", endAt: "2026-12-12T11:00:00.000Z", timezone: TZ };

  it("one-off event: upcoming → ongoing → past by the clock, not the calendar day", () => {
    expect(getEventStatus(oneOff, at("2026-12-12T08:59:00.000Z"))).toBe("upcoming");
    expect(getEventStatus(oneOff, at("2026-12-12T10:00:00.000Z"))).toBe("ongoing");
    expect(getEventStatus(oneOff, at("2026-12-12T11:01:00.000Z"))).toBe("past");
  });

  it("one-off event without an end runs for two hours", () => {
    const e = { startAt: "2026-12-12T09:00:00.000Z", endAt: null, timezone: TZ };
    expect(getEventStatus(e, at("2026-12-12T10:30:00.000Z"))).toBe("ongoing");
    expect(getEventStatus(e, at("2026-12-12T11:30:00.000Z"))).toBe("past");
  });

  it("multi-day event is ongoing for its whole span", () => {
    const e = { startAt: "2026-12-01T08:00:00.000Z", endAt: "2026-12-03T18:00:00.000Z", timezone: TZ };
    expect(getEventStatus(e, at("2026-12-02T23:00:00.000Z"))).toBe("ongoing");
  });
});

describe("recurring events are not past after their first day", () => {
  // Real data: started 9 Nov, no end date, four daily sessions 22:00 → 06:00 Lagos time.
  const prayerWatch = {
    startAt: "2026-11-09T21:00:00.000Z",
    endAt: null,
    timezone: TZ,
    Schedules: [
      { startTime: "22:00", endTime: "00:00", recurrenceRule: "DAILY" },
      { startTime: "00:00", endTime: "02:00", recurrenceRule: "DAILY" },
      { startTime: "02:00", endTime: "04:00", recurrenceRule: "DAILY" },
      { startTime: "04:00", endTime: "06:00", recurrenceRule: "DAILY" },
    ],
  };

  it("is ongoing during a session weeks later", () => {
    // 25 Nov, 23:30 Lagos time
    expect(getEventStatus(prayerWatch, at("2026-11-25T22:30:00.000Z"))).toBe("ongoing");
  });

  it("is upcoming between sessions, pointing at the next one", () => {
    // 25 Nov, 12:00 Lagos → next session 22:00 Lagos the same day
    const t = getEventTiming(prayerWatch, at("2026-11-25T11:00:00.000Z"));
    expect(t.status).toBe("upcoming");
    expect(t.occurrence.start.toISOString()).toBe("2026-11-25T21:00:00.000Z");
  });

  it("ends once the series end date passes", () => {
    const ended = { ...prayerWatch, endAt: "2026-11-20T05:00:00.000Z" };
    expect(getEventStatus(ended, at("2026-11-25T22:30:00.000Z"))).toBe("past");
  });

  it("weekly sessions repeat on the start date's weekday", () => {
    // Wednesday 25 Nov 2026, 17:30 Lagos; weekly session 17:30–19:30
    const wed = {
      startAt: "2026-11-25T16:30:00.000Z",
      endAt: null,
      timezone: TZ,
      Schedules: [{ startTime: "17:30", endTime: "19:30", recurrenceRule: "WEEKLY" }],
    };
    expect(getEventStatus(wed, at("2026-12-02T17:00:00.000Z"))).toBe("ongoing"); // next Wednesday
    const t = getEventTiming(wed, at("2026-11-27T10:00:00.000Z")); // Friday
    expect(t.status).toBe("upcoming");
    expect(t.occurrence.start.toISOString()).toBe("2026-12-02T16:30:00.000Z");
  });
});
