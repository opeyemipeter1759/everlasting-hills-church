import { describe, expect, it } from "vitest";
import { durationLong, durationShort, minutesBetween, nightShort, nightWeekday } from "./prayer-watch-nights";

describe("minutesBetween", () => {
  it("measures a watch across midnight", () => {
    expect(minutesBetween("22:00", "00:00")).toBe(120);
    expect(minutesBetween("23:40", "01:10")).toBe(90);
    expect(minutesBetween("04:00", "06:00")).toBe(120);
  });

  it("refuses times that run backwards, sit in the day, or aren't times", () => {
    expect(minutesBetween("01:00", "00:30")).toBeNull();
    expect(minutesBetween("13:00", "14:00")).toBeNull();
    expect(minutesBetween("22:00", "")).toBeNull();
  });
});

describe("durations and nights", () => {
  it("reads naturally in both lengths", () => {
    expect(durationLong(90)).toBe("1 hour 30 minutes");
    expect(durationLong(120)).toBe("2 hours");
    expect(durationShort(45)).toBe("45m");
    expect(durationShort(150)).toBe("2h 30m");
    expect(durationShort(0)).toBe("0h");
  });

  it("names a night by its evening", () => {
    expect(nightShort("2026-11-09")).toBe("Mon 9 Nov");
    expect(nightWeekday("2026-11-09")).toBe("Monday");
  });
});
