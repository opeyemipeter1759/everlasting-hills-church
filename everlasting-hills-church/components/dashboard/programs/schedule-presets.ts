/**
 * The schedule builder's presets, so no one ever types an RRULE. Each preset
 * maps to exactly one of the rules the API accepts, and back again, so a
 * saved program reopens on the preset it was made with.
 */
export type Day = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export const DAYS: { code: Day; short: string; long: string }[] = [
  { code: "MO", short: "Mon", long: "Monday" },
  { code: "TU", short: "Tue", long: "Tuesday" },
  { code: "WE", short: "Wed", long: "Wednesday" },
  { code: "TH", short: "Thu", long: "Thursday" },
  { code: "FR", short: "Fri", long: "Friday" },
  { code: "SA", short: "Sat", long: "Saturday" },
  { code: "SU", short: "Sun", long: "Sunday" },
];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type Preset =
  | { kind: "weekly"; days: Day[]; startTime: string; durationMinutes: number }
  | { kind: "monthlyLast"; startTime: string; durationMinutes: number }
  | { kind: "monthlyDay"; day: number; startTime: string; durationMinutes: number }
  | { kind: "yearlyLastWeekend"; month: number; startTime: string; confirmed: boolean }
  | { kind: "yearlyEditions"; month: number }
  | { kind: "tba" };

export const PRESET_LABEL: Record<Preset["kind"], string> = {
  weekly: "Weekly on these days",
  monthlyLast: "Monthly on the last day",
  monthlyDay: "Monthly on day N",
  yearlyLastWeekend: "Yearly on the last weekend of a month",
  yearlyEditions: "Yearly in a month (dates per edition)",
  tba: "Date to be announced",
};

export interface ScheduleFields {
  cadence: "WEEKLY" | "MONTHLY" | "ANNUAL" | "CUSTOM";
  recurrenceRule: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  startOffsetDays: number;
  dateStatus: "CONFIRMED" | "TBA";
}

/** A weekend: Friday to Sunday around the last Saturday. */
const WEEKEND_MINUTES = 3 * 24 * 60;

export function scheduleFromPreset(p: Preset): ScheduleFields {
  switch (p.kind) {
    case "weekly":
      return { cadence: "WEEKLY", recurrenceRule: `FREQ=WEEKLY;BYDAY=${DAYS.filter((d) => p.days.includes(d.code)).map((d) => d.code).join(",")}`, startTime: p.startTime, durationMinutes: p.durationMinutes, startOffsetDays: 0, dateStatus: "CONFIRMED" };
    case "monthlyLast":
      return { cadence: "MONTHLY", recurrenceRule: "FREQ=MONTHLY;BYMONTHDAY=-1", startTime: p.startTime, durationMinutes: p.durationMinutes, startOffsetDays: 0, dateStatus: "CONFIRMED" };
    case "monthlyDay":
      return { cadence: "MONTHLY", recurrenceRule: `FREQ=MONTHLY;BYMONTHDAY=${p.day}`, startTime: p.startTime, durationMinutes: p.durationMinutes, startOffsetDays: 0, dateStatus: "CONFIRMED" };
    case "yearlyLastWeekend":
      return { cadence: "ANNUAL", recurrenceRule: `FREQ=YEARLY;BYMONTH=${p.month};BYDAY=-1SA`, startTime: p.startTime, durationMinutes: WEEKEND_MINUTES, startOffsetDays: -1, dateStatus: p.confirmed ? "CONFIRMED" : "TBA" };
    case "yearlyEditions":
      return { cadence: "ANNUAL", recurrenceRule: `FREQ=YEARLY;BYMONTH=${p.month}`, startTime: null, durationMinutes: null, startOffsetDays: 0, dateStatus: "TBA" };
    case "tba":
      return { cadence: "CUSTOM", recurrenceRule: null, startTime: null, durationMinutes: null, startOffsetDays: 0, dateStatus: "TBA" };
  }
}

/** The preset a saved schedule came from. Anything else reads as to be announced, never a guess. */
export function presetFromSchedule(s: ScheduleFields): Preset {
  const r = s.recurrenceRule ?? "";
  const time = s.startTime ?? "22:00";
  const length = s.durationMinutes ?? 120;
  let m: RegExpMatchArray | null;
  if ((m = r.match(/^FREQ=WEEKLY;BYDAY=([A-Z,]+)$/))) return { kind: "weekly", days: m[1].split(",") as Day[], startTime: time, durationMinutes: length };
  if (r === "FREQ=MONTHLY;BYMONTHDAY=-1") return { kind: "monthlyLast", startTime: time, durationMinutes: length };
  if ((m = r.match(/^FREQ=MONTHLY;BYMONTHDAY=(\d+)$/))) return { kind: "monthlyDay", day: Number(m[1]), startTime: time, durationMinutes: length };
  if ((m = r.match(/^FREQ=YEARLY;BYMONTH=(\d+);BYDAY=-1SA$/))) return { kind: "yearlyLastWeekend", month: Number(m[1]), startTime: time, confirmed: s.dateStatus === "CONFIRMED" };
  if ((m = r.match(/^FREQ=YEARLY;BYMONTH=(\d+)$/))) return { kind: "yearlyEditions", month: Number(m[1]) };
  return { kind: "tba" };
}

/** A sensible starting point when someone switches preset. */
export function defaultPreset(kind: Preset["kind"]): Preset {
  switch (kind) {
    case "weekly":
      return { kind, days: ["SU"], startTime: "09:00", durationMinutes: 120 };
    case "monthlyLast":
      return { kind, startTime: "22:00", durationMinutes: 180 };
    case "monthlyDay":
      return { kind, day: 1, startTime: "18:00", durationMinutes: 120 };
    case "yearlyLastWeekend":
      return { kind, month: 4, startTime: "10:00", confirmed: false };
    case "yearlyEditions":
      return { kind, month: 10 };
    case "tba":
      return { kind };
  }
}
