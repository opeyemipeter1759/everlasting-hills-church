/**
 * When is an event actually happening? One source of truth for the events page
 * tabs, the homepage teaser, the event hero and the card status chip.
 *
 * Uses the real date AND time (not just the calendar day):
 *   - one-off event: ongoing between startAt and endAt (startAt + 2h when no end
 *     is set), upcoming before, past after.
 *   - recurring event (has meeting times with a recurrence rule such as DAILY or
 *     WEEKLY): the series runs from startAt until endAt — or indefinitely when no
 *     end is set. It is "ongoing" while one of its sessions is running, "upcoming"
 *     between sessions (with the next session's time), and only "past" once the
 *     series has ended. Previously a recurring event with no end date was treated
 *     as ending on its first day and dropped into Past.
 */

export type EventTemporalStatus = "ongoing" | "upcoming" | "past";

export interface EventTimingInput {
  startAt: string;
  endAt: string | null;
  timezone?: string | null;
  Schedules?: { startTime: string; endTime?: string | null; recurrenceRule?: string | null }[] | null;
}

export interface EventTiming {
  status: EventTemporalStatus;
  /** The session running now (ongoing), the next one (upcoming), or the last one (past). */
  occurrence: { start: Date; end: Date };
  recurring: boolean;
}

const DEFAULT_TZ = "Africa/Lagos";
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type Rule = "DAILY" | "WEEKLY" | "MONTHLY";

function ruleOf(raw: string | null | undefined): Rule | null {
  const r = raw?.trim().toUpperCase();
  if (!r) return null;
  if (r.includes("WEEKLY")) return "WEEKLY";
  if (r.includes("MONTHLY")) return "MONTHLY";
  return "DAILY"; // "DAILY" and anything unrecognised repeat every day
}

/** "YYYY-MM-DD" of an instant in `tz`. */
function dayKey(d: Date, tz: string): string {
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}

/** Offset (ms) of `tz` from UTC at instant `d`. */
function tzOffset(d: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

/** The instant of local wall-clock `HH:MM` on local day `YYYY-MM-DD` in `tz`. */
function zoned(day: string, hhmm: string, tz: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  return new Date(guess - tzOffset(new Date(guess), tz));
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function getEventTiming(event: EventTimingInput, now: Date = new Date()): EventTiming {
  const tz = event.timezone || DEFAULT_TZ;
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  const sessions = (event.Schedules ?? [])
    .map((s) => ({ ...s, rule: ruleOf(s.recurrenceRule) }))
    .filter((s) => s.rule && /^\d{1,2}:\d{2}/.test(s.startTime));

  // ── One-off event ──────────────────────────────────────────────────────────
  if (sessions.length === 0) {
    const finish = end && end > start ? end : new Date(start.getTime() + DEFAULT_DURATION_MS);
    const status: EventTemporalStatus = now < start ? "upcoming" : now < finish ? "ongoing" : "past";
    return { status, occurrence: { start, end: finish }, recurring: false };
  }

  // ── Recurring series ───────────────────────────────────────────────────────
  const firstDay = dayKey(start, tz);
  const seriesEnd = end; // null = runs until the event is unpublished
  const anchorWeekday = weekday(firstDay);
  const anchorMonthDay = Number(firstDay.slice(8, 10));

  const today = dayKey(now, tz);
  const fromDay = today < firstDay ? firstDay : addDays(today, -1); // -1 catches sessions crossing midnight
  let current: { start: Date; end: Date } | null = null;
  let next: { start: Date; end: Date } | null = null;
  let last: { start: Date; end: Date } | null = null;

  for (let i = 0; i <= 62 && !next; i++) {
    const day = addDays(fromDay, i);
    for (const s of sessions) {
      if (s.rule === "WEEKLY" && weekday(day) !== anchorWeekday) continue;
      if (s.rule === "MONTHLY" && Number(day.slice(8, 10)) !== anchorMonthDay) continue;
      const occStart = zoned(day, s.startTime, tz);
      let occEnd = s.endTime && /^\d{1,2}:\d{2}/.test(s.endTime)
        ? zoned(day, s.endTime, tz)
        : new Date(occStart.getTime() + DEFAULT_DURATION_MS);
      if (occEnd <= occStart) occEnd = new Date(occEnd.getTime() + DAY_MS); // e.g. 22:00–00:00
      if (seriesEnd && occStart > seriesEnd) continue;

      if (occStart <= now && now < occEnd) current = { start: occStart, end: occEnd };
      else if (occStart > now && (!next || occStart < next.start)) next = { start: occStart, end: occEnd };
      else if (occEnd <= now && (!last || occStart > last.start)) last = { start: occStart, end: occEnd };
    }
  }

  if (current) return { status: "ongoing", occurrence: current, recurring: true };
  if (next) return { status: "upcoming", occurrence: next, recurring: true };
  return {
    status: "past",
    occurrence: last ?? { start, end: seriesEnd ?? new Date(start.getTime() + DEFAULT_DURATION_MS) },
    recurring: true,
  };
}

export function getEventStatus(event: EventTimingInput, now: Date = new Date()): EventTemporalStatus {
  return getEventTiming(event, now).status;
}
