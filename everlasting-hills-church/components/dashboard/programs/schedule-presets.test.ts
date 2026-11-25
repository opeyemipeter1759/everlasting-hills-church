import { describe, expect, it } from "vitest";
import { presetFromSchedule, scheduleFromPreset, type Preset } from "./schedule-presets";

describe("schedule presets", () => {
  it.each<[string, Preset, object]>([
    [
      "weekly on chosen days",
      { kind: "weekly", days: ["MO", "TU", "TH", "FR", "SA"], startTime: "22:00", durationMinutes: 480 },
      { recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA", startTime: "22:00", durationMinutes: 480, startOffsetDays: 0, dateStatus: "CONFIRMED", cadence: "WEEKLY" },
    ],
    [
      "monthly on the last day",
      { kind: "monthlyLast", startTime: "22:00", durationMinutes: 2880 },
      { recurrenceRule: "FREQ=MONTHLY;BYMONTHDAY=-1", startTime: "22:00", durationMinutes: 2880, startOffsetDays: 0, dateStatus: "CONFIRMED", cadence: "MONTHLY" },
    ],
    [
      "monthly on day N",
      { kind: "monthlyDay", day: 15, startTime: "18:00", durationMinutes: 120 },
      { recurrenceRule: "FREQ=MONTHLY;BYMONTHDAY=15", startTime: "18:00", durationMinutes: 120, cadence: "MONTHLY" },
    ],
    [
      "yearly on the last weekend of a month",
      { kind: "yearlyLastWeekend", month: 4, startTime: "10:00", confirmed: false },
      { recurrenceRule: "FREQ=YEARLY;BYMONTH=4;BYDAY=-1SA", startOffsetDays: -1, durationMinutes: 4320, dateStatus: "TBA", cadence: "ANNUAL" },
    ],
    [
      "yearly in a month, dates per edition",
      { kind: "yearlyEditions", month: 10 },
      { recurrenceRule: "FREQ=YEARLY;BYMONTH=10", startTime: null, durationMinutes: null, dateStatus: "TBA", cadence: "ANNUAL" },
    ],
    ["date to be announced", { kind: "tba" }, { recurrenceRule: null, startTime: null, durationMinutes: null, dateStatus: "TBA", cadence: "CUSTOM" }],
  ])("%s produces the right rule", (_name, preset, expected) => {
    expect(scheduleFromPreset(preset)).toMatchObject(expected);
  });

  it("reads every preset back from what it saved, so editing a program reopens the right preset", () => {
    const presets: Preset[] = [
      { kind: "weekly", days: ["MO", "TU", "TH", "FR", "SA"], startTime: "22:00", durationMinutes: 480 },
      { kind: "monthlyLast", startTime: "22:00", durationMinutes: 2880 },
      { kind: "monthlyDay", day: 15, startTime: "18:00", durationMinutes: 120 },
      { kind: "yearlyLastWeekend", month: 4, startTime: "10:00", confirmed: true },
      { kind: "yearlyEditions", month: 10 },
      { kind: "tba" },
    ];
    for (const p of presets) expect(presetFromSchedule(scheduleFromPreset(p))).toEqual(p);
  });

  it("treats a rule it does not know as to be announced rather than guessing", () => {
    expect(presetFromSchedule({ recurrenceRule: "FREQ=DAILY", startTime: "06:00", durationMinutes: 60, startOffsetDays: 0, dateStatus: "CONFIRMED", cadence: "CUSTOM" }).kind).toBe("tba");
  });
});
