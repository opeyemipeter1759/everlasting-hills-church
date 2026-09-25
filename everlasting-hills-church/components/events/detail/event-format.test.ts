import { describe, expect, it } from "vitest";
import { formatEventDateRange, getEventStatus } from "./event-format";

describe("event date formatting", () => {
  it("formats a multi-day event in its configured timezone", () => {
    expect(formatEventDateRange(
      "2026-10-01T23:00:00.000Z",
      "2026-10-31T22:59:59.000Z",
      "Africa/Lagos",
    )).toBe("2–31 Oct 2026");
  });

  it("derives an event state without storing it", () => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    const start = `${today}T00:00:00+01:00`;
    const end = `${today}T23:59:59+01:00`;
    expect(getEventStatus(start, end, "Africa/Lagos")).toBe("ongoing");
  });
});
