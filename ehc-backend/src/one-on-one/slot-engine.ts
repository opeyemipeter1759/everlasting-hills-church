/** Africa/Lagos is UTC+1 year-round, with no daylight saving. */
const WAT_OFFSET_MS = 60 * 60 * 1000;
const MINUTE_MS = 60_000;
/** After skipping past something busy, the next start is rounded up to this. */
const START_GRANULARITY_MIN = 15;

export interface WeeklyWindow {
  /** 0 = Sunday, in church local time. */
  weekday: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface SlotEngineInput {
  rules: WeeklyWindow[];
  /** Whole days off, "YYYY-MM-DD" in church local time. */
  blockedDates: string[];
  /** Other sessions and calendar events. The buffer is applied around each. */
  busy: BusyInterval[];
  /** Active sessions per local date, for the daily cap. */
  sessionsPerDay: Record<string, number>;
  durationMinutes: number;
  bufferMinutes: number;
  dailyCap: number;
  minNoticeHours: number;
  horizonDays: number;
  /** Inclusive local date range to compute, "YYYY-MM-DD". */
  from: string;
  to: string;
  now: Date;
}

export interface Slot {
  startsAt: Date;
  endsAt: Date;
}

export function parseHhmm(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** The UTC instant of a church-local wall time on a local date. */
export function wallTime(date: string, minutesOfDay: number): Date {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d) + minutesOfDay * MINUTE_MS - WAT_OFFSET_MS);
}

/** The church-local calendar date of an instant, "YYYY-MM-DD". */
export function localDateKey(instant: Date): string {
  return new Date(instant.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDaysToKey(date: string, days: number): string {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d + days)).toISOString().slice(0, 10);
}

function weekdayOf(date: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

function roundUpToGranularity(instant: Date): Date {
  const step = START_GRANULARITY_MIN * MINUTE_MS;
  const local = instant.getTime() + WAT_OFFSET_MS;
  return new Date(Math.ceil(local / step) * step - WAT_OFFSET_MS);
}

/**
 * Open start times per local date, only for dates that have at least one.
 *
 * Within each weekly window, starts are laid out back to back (session plus
 * buffer). When a start would collide with something busy, the next candidate
 * is the first quarter hour after that busy time plus the buffer, so openings
 * sit naturally around existing commitments.
 */
export function computeSlots(input: SlotEngineInput): Record<string, Slot[]> {
  const durationMs = input.durationMinutes * MINUTE_MS;
  const bufferMs = input.bufferMinutes * MINUTE_MS;
  const earliest = input.now.getTime() + input.minNoticeHours * 60 * MINUTE_MS;
  const latest = input.now.getTime() + input.horizonDays * 24 * 60 * MINUTE_MS;
  const blocked = new Set(input.blockedDates);
  const result: Record<string, Slot[]> = {};

  for (let date = input.from; date <= input.to; date = addDaysToKey(date, 1)) {
    if (blocked.has(date)) continue;
    if ((input.sessionsPerDay[date] ?? 0) >= input.dailyCap) continue;

    const windows = input.rules.filter((r) => r.weekday === weekdayOf(date));
    const starts = new Map<number, Slot>();

    for (const window of windows) {
      const windowStart = parseHhmm(window.startTime);
      const windowEnd = wallTime(date, parseHhmm(window.endTime)).getTime();
      let cursor = wallTime(date, windowStart).getTime();

      while (cursor + durationMs <= windowEnd) {
        const end = cursor + durationMs;
        const collisions = input.busy.filter(
          (b) => cursor < b.end.getTime() + bufferMs && end > b.start.getTime() - bufferMs,
        );
        if (collisions.length > 0) {
          const clearAt = Math.max(...collisions.map((b) => b.end.getTime())) + bufferMs;
          cursor = Math.max(cursor + MINUTE_MS, roundUpToGranularity(new Date(clearAt)).getTime());
          continue;
        }
        if (cursor >= earliest && cursor <= latest) {
          starts.set(cursor, { startsAt: new Date(cursor), endsAt: new Date(end) });
        }
        cursor = end + bufferMs;
      }
    }

    if (starts.size > 0) {
      result[date] = [...starts.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    }
  }

  return result;
}
