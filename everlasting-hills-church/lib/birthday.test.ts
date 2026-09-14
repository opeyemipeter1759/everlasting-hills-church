import { describe, expect, it } from "vitest";
import { daysUntilBirthday, isBirthdayToday, watDate } from "./birthday";

describe("birthdays on Lagos time", () => {
  it("turns over at midnight in Lagos, not in UTC", () => {
    // 23:30 UTC on the 13th is already 00:30 on the 14th in Lagos.
    const now = new Date("2026-09-13T23:30:00Z");
    expect(isBirthdayToday("1990-09-14T00:00:00.000Z", now)).toBe(true);
    expect(isBirthdayToday("1990-09-13T00:00:00.000Z", now)).toBe(false);
    expect(watDate(now)).toBe("2026-09-14");
  });

  it("counts forward across the new year", () => {
    expect(daysUntilBirthday("1990-01-02T00:00:00.000Z", new Date("2026-12-30T12:00:00Z"))).toBe(3);
  });

  it("celebrates a 29 February birthday on 1 March in other years", () => {
    expect(isBirthdayToday("2000-02-29T00:00:00.000Z", new Date("2027-03-01T12:00:00Z"))).toBe(true);
    expect(isBirthdayToday("2000-02-29T00:00:00.000Z", new Date("2028-02-29T12:00:00Z"))).toBe(true);
  });

  it("treats a missing or unreadable date as no birthday", () => {
    expect(isBirthdayToday(null)).toBe(false);
    expect(daysUntilBirthday("not a date")).toBeNull();
  });
});
