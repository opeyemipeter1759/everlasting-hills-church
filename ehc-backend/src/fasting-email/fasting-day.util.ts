/**
 * One day of a fast, worked out from the event's Fasting Schedule section —
 * the same rules the event page lays its calendar out from
 * (everlasting-hills-church/components/events/detail/fasting-schedule.ts),
 * so the email and the page always say the same thing.
 */

export interface FastingRules {
  startDate: string;
  endDate: string;
  mealTime: string;
  dryFasts: { startDate: string; endDate: string; breakTime: string }[];
  morningTime?: string;
  eveningTime?: string;
  noMorningDays: number[];
  noEveningDays: number[];
  serviceDays: number[];
}

export interface FastDayInfo {
  date: string;
  weekday: number;
  dayNumber: number;
  totalDays: number;
  kind: 'meal' | 'dry';
  dryDay?: number;
  dryLength?: number;
  /** Set on the last day of a dry fast: when it breaks. */
  breakTime?: string;
  /** Set on the day before a dry fast begins: this is the last meal. */
  lastMealBefore?: { days: number; startDate: string };
  isFirst: boolean;
  isLast: boolean;
  morning: string | null;
  evening: string | null;
  mealTime: string;
}

const DAY_MS = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const span = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / DAY_MS) + 1;

/** The calendar date in Lagos (UTC+1 all year), as YYYY-MM-DD. */
export function lagosDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(at);
}

export function addDays(iso: string, days: number): string {
  return toIso(toTime(iso) + days * DAY_MS);
}

/** The day of the fast `date` falls on, or null outside it. */
export function fastDay(rules: FastingRules, date: string): FastDayInfo | null {
  if (date < rules.startDate || date > rules.endDate) return null;
  const weekday = new Date(toTime(date)).getUTCDay();
  const dry = rules.dryFasts.find((d) => date >= d.startDate && date <= d.endDate);
  const next = rules.dryFasts.find((d) => d.startDate === addDays(date, 1));
  return {
    date,
    weekday,
    dayNumber: span(rules.startDate, date),
    totalDays: span(rules.startDate, rules.endDate),
    kind: dry ? 'dry' : 'meal',
    ...(dry && {
      dryDay: span(dry.startDate, date),
      dryLength: span(dry.startDate, dry.endDate),
      ...(date === dry.endDate && { breakTime: dry.breakTime }),
    }),
    ...(next && !dry && { lastMealBefore: { days: span(next.startDate, next.endDate), startDate: next.startDate } }),
    isFirst: date === rules.startDate,
    isLast: date === rules.endDate,
    morning: rules.serviceDays.includes(weekday)
      ? 'Sunday service'
      : rules.morningTime && !rules.noMorningDays.includes(weekday)
        ? `${rules.morningTime} morning prayer`
        : null,
    evening: rules.eveningTime && !rules.noEveningDays.includes(weekday) ? `${rules.eveningTime} evening prayer` : null,
    mealTime: rules.mealTime,
  };
}
