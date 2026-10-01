import { describe, expect, it } from "vitest";
import { dateSpan, planFast, shortDate, weekdayRange, type FastingContent } from "./fasting-schedule";

/** Furnace '26, as its fasting schedule PDF sets it out. */
const FURNACE: FastingContent = {
  startDate: "2026-10-02",
  endDate: "2026-10-31",
  mealTime: "3pm",
  dryFasts: [
    { startDate: "2026-10-03", endDate: "2026-10-04", breakTime: "3pm" },
    { startDate: "2026-10-09", endDate: "2026-10-11", breakTime: "3pm" },
    { startDate: "2026-10-17", endDate: "2026-10-18", breakTime: "3pm" },
    { startDate: "2026-10-23", endDate: "2026-10-25", breakTime: "3pm" },
  ],
  morningTime: "6am",
  eveningTime: "8pm",
  noMorningDays: [0],
  noEveningDays: [6],
  serviceDays: [0],
  guidelines: [],
};

const day = (date: string) => planFast(FURNACE).days.find((d) => d.date === date)!;

describe("laying out Furnace '26 from its rules", () => {
  it("is 30 days, with 10 of them dry: 2 + 3 + 2 + 3", () => {
    const plan = planFast(FURNACE);
    expect(plan.totalDays).toBe(30);
    expect(plan.dryDays).toBe(10);
    expect(plan.weekends.map((w) => w.days)).toEqual([2, 3, 2, 3]);
  });

  it("gives each weekend its last meal the day before and its break on the Sunday", () => {
    const [first, second] = planFast(FURNACE).weekends;
    expect(first).toMatchObject({ lastMealDate: "2026-10-02", endDate: "2026-10-04", breakTime: "3pm" });
    expect(second).toMatchObject({ lastMealDate: "2026-10-08", startDate: "2026-10-09" });
  });

  it("matches the PDF's calendar, day by day where it matters", () => {
    expect(day("2026-10-02")).toMatchObject({ dayNumber: 1, kind: "meal", isFirst: true, morning: "6am Morning", evening: "8pm Evening" });
    expect(day("2026-10-03")).toMatchObject({ dayNumber: 2, kind: "dry", dryDay: 1, dryLength: 2, morning: "6am Morning", evening: null });
    expect(day("2026-10-04")).toMatchObject({ dayNumber: 3, dryDay: 2, breakTime: "3pm", morning: "Sunday service", evening: "8pm Evening" });
    expect(day("2026-10-09")).toMatchObject({ dayNumber: 8, dryDay: 1, dryLength: 3, evening: "8pm Evening" });
    expect(day("2026-10-11")).toMatchObject({ dayNumber: 10, dryDay: 3, breakTime: "3pm" });
    expect(day("2026-10-30")).toMatchObject({ dayNumber: 29, kind: "meal" });
    expect(day("2026-10-31")).toMatchObject({ dayNumber: 30, kind: "meal", isLast: true, evening: null });
  });

  it("lays the calendar out Monday-first, from Mon 28 Sept to Sun 1 Nov", () => {
    const { weeks } = planFast(FURNACE);
    expect(weeks).toHaveLength(5);
    expect(weeks[0].map((c) => c?.dayOfMonth)).toEqual([28, 29, 30, 1, 2, 3, 4]);
    expect(weeks[0].slice(0, 4).every((c) => c && !c.inFast)).toBe(true);
    expect(weeks[4].map((c) => c?.dayOfMonth)).toEqual([26, 27, 28, 29, 30, 31, 1]);
    expect(weeks[4][6]?.inFast).toBe(false);
  });
});

describe("date wording", () => {
  it("reads like the PDF", () => {
    expect(shortDate("2026-10-02")).toBe("Fri 2nd Oct");
    expect(shortDate("2026-10-11")).toBe("Sun 11th Oct");
    expect(shortDate("2026-10-23")).toBe("Fri 23rd Oct");
    expect(dateSpan("2026-10-02", "2026-10-31", true)).toBe("Fri 2nd to Sat 31st October");
    expect(dateSpan("2026-10-03", "2026-10-04")).toBe("Sat 3rd to Sun 4th Oct");
    expect(weekdayRange([0])).toBe("Mon - Sat");
    expect(weekdayRange([6])).toBe("Sun - Fri");
    expect(weekdayRange([])).toBe("Every day");
    expect(weekdayRange([1, 3])).toBe("Sun, Tue, Thu, Fri, Sat");
  });
});
