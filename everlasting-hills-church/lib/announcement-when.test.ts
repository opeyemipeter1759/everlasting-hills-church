import { describe, expect, it } from "vitest";
import { announcementWhen } from "./announcement-when";

// Saturday 7 November 2026, 10:00 in Lagos (UTC+1).
const NOW = new Date("2026-11-07T09:00:00Z");
const posted = (iso: string) => ({ createdAt: iso });
const event = (startAt: string) => ({ createdAt: "2026-11-07T08:00:00Z", Event: { startAt } });

describe("announcementWhen", () => {
  it("never calls a plain announcement 'Today': it shows when it was posted", () => {
    expect(announcementWhen(posted("2026-11-07T08:00:00Z"), NOW)).toEqual({ label: "Posted 7 Nov", isEvent: false, isToday: false });
    expect(announcementWhen(posted("2025-12-30T08:00:00Z"), NOW).label).toBe("Posted 30 Dec 2025");
  });

  it("shows an event's own date, even when it was posted today", () => {
    expect(announcementWhen(event("2026-11-13T17:00:00Z"), NOW)).toEqual({ label: "Fri 13 Nov", isEvent: true, isToday: false });
  });

  it("says Today and Tomorrow only when the event really is", () => {
    expect(announcementWhen(event("2026-11-07T17:00:00Z"), NOW)).toEqual({ label: "Today", isEvent: true, isToday: true });
    expect(announcementWhen(event("2026-11-08T07:00:00Z"), NOW).label).toBe("Tomorrow");
  });

  it("counts days in Lagos time, not the reader's", () => {
    // 23:30 UTC on the 7th is 00:30 on the 8th in Lagos: tomorrow, not today.
    expect(announcementWhen(event("2026-11-07T23:30:00Z"), NOW).label).toBe("Tomorrow");
  });
});
