/**
 * Counselling sessions are entered and shown in Lagos time and stored in UTC.
 * Lagos is UTC+1 all year (no daylight saving), so the conversion is a fixed
 * offset. The calendar date is always worked out in Lagos, never in UTC: for
 * the last hour of every UTC day the two differ (the Gatherings toView bug).
 */
const OFFSET_MS = 60 * 60 * 1000;

/** A Lagos date and time ("2026-12-01", "00:30") as the UTC instant. */
export function lagosToUtc(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+01:00`);
}

/** The Lagos calendar date and clock time of an instant. */
export function lagosParts(at: Date): { date: string; time: string } {
  const local = new Date(at.getTime() + OFFSET_MS).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export function lagosToday(now = new Date()): string {
  return lagosParts(now).date;
}

/** The first instant of a Lagos day, for date filters. */
export function lagosDayStart(date: string): Date {
  return new Date(`${date}T00:00:00+01:00`);
}

/** "Tuesday, 1 December 2026 at 12:30 am", for emails. */
export function lagosLabel(at: Date): string {
  const day = at.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
  const time = at.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  });
  return `${day} at ${time}`;
}
