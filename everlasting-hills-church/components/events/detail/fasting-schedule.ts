import type { EventSection } from "@/types";

export type FastingContent = Extract<EventSection, { type: "FASTING_SCHEDULE" }>["content"];

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Dates are calendar days ("2026-10-02"), read as UTC so no timezone can shift them. */
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "Sat 3rd Oct" */
export function shortDate(iso: string): string {
  const d = new Date(toTime(iso));
  return `${WEEKDAYS[d.getUTCDay()]} ${ordinal(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
}

/** "Fri 2nd to Sat 31st October" / "Sat 3rd to Sun 4th Oct" */
export function dateSpan(startIso: string, endIso: string, longMonth = false): string {
  const a = new Date(toTime(startIso));
  const b = new Date(toTime(endIso));
  const month = (d: Date) => (longMonth ? MONTHS_LONG : MONTHS)[d.getUTCMonth()];
  const sameMonth = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  const start = `${WEEKDAYS[a.getUTCDay()]} ${ordinal(a.getUTCDate())}${sameMonth ? "" : ` ${month(a)}`}`;
  return `${start} to ${WEEKDAYS[b.getUTCDay()]} ${ordinal(b.getUTCDate())} ${month(b)}`;
}

export interface FastDay {
  date: string;
  dayOfMonth: number;
  weekday: number;
  /** 1 on the first day of the fast. */
  dayNumber: number;
  kind: "meal" | "dry";
  /** For dry days: which day of that dry fast, and how long it is. */
  dryDay?: number;
  dryLength?: number;
  /** The last day of a dry fast: it breaks at this time. */
  breakTime?: string;
  isFirst: boolean;
  isLast: boolean;
  morning: string | null;
  evening: string | null;
}

export interface DryWeekend {
  days: number;
  startDate: string;
  endDate: string;
  lastMealDate: string;
  breakTime: string;
}

export interface FastingPlan {
  totalDays: number;
  dryDays: number;
  days: FastDay[];
  weekends: DryWeekend[];
  /** Monday-first weeks for the calendar; null cells fall outside the fast's month span. */
  weeks: ({ date: string; dayOfMonth: number; inFast: boolean; day?: FastDay } | null)[][];
}

/** Lays a fast out day by day from its rules. */
export function planFast(c: FastingContent): FastingPlan {
  const start = toTime(c.startDate);
  const end = toTime(c.endDate);
  const totalDays = Math.round((end - start) / DAY_MS) + 1;
  const dryFasts = [...c.dryFasts].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const days: FastDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const t = start + i * DAY_MS;
    const date = toIso(t);
    const weekday = new Date(t).getUTCDay();
    const dry = dryFasts.find((d) => date >= d.startDate && date <= d.endDate);
    const dryLength = dry ? Math.round((toTime(dry.endDate) - toTime(dry.startDate)) / DAY_MS) + 1 : undefined;
    const isLast = i === totalDays - 1;
    days.push({
      date,
      dayOfMonth: new Date(t).getUTCDate(),
      weekday,
      dayNumber: i + 1,
      kind: dry ? "dry" : "meal",
      ...(dry && {
        dryDay: Math.round((t - toTime(dry.startDate)) / DAY_MS) + 1,
        dryLength,
        ...(date === dry.endDate && { breakTime: dry.breakTime }),
      }),
      isFirst: i === 0,
      isLast,
      morning: c.serviceDays.includes(weekday)
        ? "Sunday service"
        : c.morningTime && !c.noMorningDays.includes(weekday)
          ? `${c.morningTime} Morning`
          : null,
      evening: c.eveningTime && !c.noEveningDays.includes(weekday) ? `${c.eveningTime} Evening` : null,
    });
  }

  const weekends = dryFasts.map((d) => ({
    days: Math.round((toTime(d.endDate) - toTime(d.startDate)) / DAY_MS) + 1,
    startDate: d.startDate,
    endDate: d.endDate,
    lastMealDate: toIso(toTime(d.startDate) - DAY_MS),
    breakTime: d.breakTime,
  }));

  // Calendar: from the Monday on or before the start to the Sunday on or after the end.
  const mondayOffset = (new Date(start).getUTCDay() + 6) % 7;
  const gridStart = start - mondayOffset * DAY_MS;
  const sundayOffset = (7 - new Date(end).getUTCDay()) % 7;
  const gridEnd = end + sundayOffset * DAY_MS;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const weeks: FastingPlan["weeks"] = [];
  for (let t = gridStart; t <= gridEnd; t += 7 * DAY_MS) {
    const week: FastingPlan["weeks"][number] = [];
    for (let i = 0; i < 7; i++) {
      const cell = t + i * DAY_MS;
      const date = toIso(cell);
      const day = byDate.get(date);
      week.push({ date, dayOfMonth: new Date(cell).getUTCDate(), inFast: !!day, ...(day && { day }) });
    }
    weeks.push(week);
  }

  return { totalDays, dryDays: weekends.reduce((sum, w) => sum + w.days, 0), days, weekends, weeks };
}

/**
 * The weekdays that do have a session, as the PDF writes them: "Mon - Sat",
 * "Sun - Fri" (a range may wrap round the week), else a list.
 */
export function weekdayRange(skip: number[]): string {
  const on = [0, 1, 2, 3, 4, 5, 6].filter((d) => !skip.includes(d));
  if (on.length === 0) return "";
  if (on.length === 7) return "Every day";
  // A range starts on a day that's on, right after one that's off.
  const first = on.find((d) => !on.includes((d + 6) % 7));
  if (first !== undefined) {
    let last = first;
    let count = 1;
    while (on.includes((last + 1) % 7) && count < on.length) {
      last = (last + 1) % 7;
      count++;
    }
    if (count === on.length) return `${WEEKDAYS[first]} - ${WEEKDAYS[last]}`;
  }
  return on.map((d) => WEEKDAYS[d]).join(", ");
}
