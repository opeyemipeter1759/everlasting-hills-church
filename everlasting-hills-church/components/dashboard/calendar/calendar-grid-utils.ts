export type CalendarView = "month" | "week" | "day";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface CalendarItem {
  id: string;
  kind: "service" | "event" | "gathering" | "personal";
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601, optional — defaults to `start` for point-in-time items. */
  end?: string | null;
  location: string | null;
  cancelled: boolean;
  servingRoles: string[] | null;
  isLive: boolean;
  htmlLink: string | null;
}

// ── Day math ─────────────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  // Anchored to the 1st before shifting: adding a month to the 31st would otherwise
  // skip a month entirely (Jan 31 + 1 month = Mar 3).
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** Sunday of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  return addDays(x, -x.getDay());
}

/** Weeks of cells for the month grid, including the adjacent-month spill-over days. */
export function monthMatrix(cursor: Date): Date[][] {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const from = startOfWeek(firstOfMonth);
  const to = addDays(startOfWeek(lastOfMonth), 6);

  const weeks: Date[][] = [];
  let day = from;
  while (day <= to) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// ── Item placement ───────────────────────────────────────────────────────────

/**
 * Items touching `day`, soonest first. An item occupies [start, end ?? start], so
 * a multi-day personal event correctly appears on every day it spans.
 */
export function itemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const from = startOfDay(day).getTime();
  const to = endOfDay(day).getTime();
  return items
    .filter((item) => {
      const start = new Date(item.start).getTime();
      const end = item.end ? new Date(item.end).getTime() : start;
      return start <= to && end >= from;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatViewTitle(view: CalendarView, cursor: Date): string {
  if (view === "day") {
    return cursor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (view === "week") {
    const from = startOfWeek(cursor);
    const to = addDays(from, 6);
    const sameMonth = from.getMonth() === to.getMonth();
    const left = from.toLocaleDateString(undefined, { day: "numeric", month: sameMonth ? undefined : "short" });
    const right = to.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    return `${left} - ${right}`;
  }
  return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
