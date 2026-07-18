import type { CalendarEvent } from "@/lib/api/calendar";

export type CalendarView = "month" | "week" | "day";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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

// ── Grid windows ─────────────────────────────────────────────────────────────

/**
 * The full span a view actually renders, which is what the API window must cover.
 *
 * For "month" this deliberately runs from the Sunday before the 1st to the Saturday
 * after the last day: those leading/trailing cells are visible, so events landing on
 * them have to be fetched too. Querying only the 1st..31st would leave them blank.
 */
export function viewRange(view: CalendarView, cursor: Date): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(cursor), to: endOfDay(cursor) };
  if (view === "week") {
    const from = startOfWeek(cursor);
    return { from, to: endOfDay(addDays(from, 6)) };
  }
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const from = startOfWeek(firstOfMonth);
  const to = endOfDay(addDays(startOfWeek(lastOfMonth), 6));
  return { from, to };
}

/** Weeks of cells for the month grid, including the adjacent-month spill-over days. */
export function monthMatrix(cursor: Date): Date[][] {
  const { from, to } = viewRange("month", cursor);
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

// ── Event placement ──────────────────────────────────────────────────────────

/**
 * Events touching `day`, soonest first. An event occupies [startAt, endAt ?? startAt],
 * so a multi-day event correctly appears on every day it spans, not just its start.
 */
export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const from = startOfDay(day).getTime();
  const to = endOfDay(day).getTime();
  return events
    .filter((e) => {
      const start = new Date(e.startAt).getTime();
      const end = e.endAt ? new Date(e.endAt).getTime() : start;
      return start <= to && end >= from;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatViewTitle(view: CalendarView, cursor: Date): string {
  if (view === "day") {
    return cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (view === "week") {
    const from = startOfWeek(cursor);
    const to = addDays(from, 6);
    const sameMonth = from.getMonth() === to.getMonth();
    const left = from.toLocaleDateString("en-GB", { day: "numeric", month: sameMonth ? undefined : "short" });
    const right = to.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${left} to ${right}`;
  }
  return cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** `<input type="datetime-local">` wants local wall-clock, not a UTC ISO string. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
