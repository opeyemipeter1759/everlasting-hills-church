/**
 * Member local dates.
 *
 * Completion and streaks are recorded against the date it is where the member
 * is, never CURRENT_DATE in UTC. In Lagos, which is UTC+1, somebody reading at
 * 00:30 local time is at 23:30 UTC the previous day: a naive implementation
 * records that against yesterday, breaks a streak that was never broken, and
 * shows the same reading again in the morning.
 *
 * This is not hypothetical here. The Gatherings module hit exactly this, where
 * toView broke during the final UTC hour of every day.
 */

/** The member local calendar date as yyyy-mm-dd. */
export function localDate(timezone: string, at: Date = new Date()): string {
  // en-CA formats as yyyy-mm-dd, which is both sortable and what the DATE
  // columns expect. The timezone does the real work.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/** Shifts a yyyy-mm-dd date by whole days. Calendar arithmetic, no clock. */
export function addDays(date: string, days: number): string {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** Whole days between two yyyy-mm-dd dates, later minus earlier. */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

/**
 * A Date at midnight UTC for a yyyy-mm-dd string, for writing to a DATE column.
 *
 * Prisma sends a JS Date for @db.Date and Postgres takes its UTC calendar date,
 * so the value must be pinned to midnight UTC. Building it from the local
 * timezone instead would shift the stored date by one for anybody east or west
 * of Greenwich, which is the whole bug this module exists to avoid.
 */
export function toDateColumn(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** Reads a DATE column back as yyyy-mm-dd without a timezone round trip. */
export function fromDateColumn(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/**
 * Guards a timezone before it is stored on a subscription.
 *
 * An invalid zone would throw inside Intl on every later read, which would take
 * down the dashboard rather than one field.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
