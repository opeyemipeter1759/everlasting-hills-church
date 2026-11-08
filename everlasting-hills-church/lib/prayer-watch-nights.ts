/**
 * Watch-night times, shared by the leader's report and the admin overview.
 * A night is named by the evening it began ("YYYY-MM-DD"), and a wall time
 * before noon belongs to the morning after, the same rule the API uses.
 */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const FULL_NIGHT = 8 * 60;

const minuteOfNight = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m + (h < 12 ? 24 * 60 : 0);
};

/** Night hours run from 8pm to 9am. */
const inNight = (hhmm: string) => {
  const h = Number(hhmm.slice(0, 2));
  return h >= 20 || h < 9;
};

/** How long a watch ran, or null when the two times don't make one. */
export function minutesBetween(start: string, end: string): number | null {
  if (!HHMM.test(start) || !HHMM.test(end) || !inNight(start) || !inNight(end)) return null;
  const diff = minuteOfNight(end) - minuteOfNight(start);
  return diff > 0 && diff <= FULL_NIGHT ? diff : null;
}

/** "2 hours", "1 hour 30 minutes", "45 minutes". */
export function durationLong(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = h === 0 ? "" : h === 1 ? "1 hour" : `${h} hours`;
  const mins = m === 0 ? "" : m === 1 ? "1 minute" : `${m} minutes`;
  return [hours, mins].filter(Boolean).join(" ") || "0 minutes";
}

/** "2h", "1h 30m", "45m", "0h". */
export function durationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m === 0 ? "0h" : `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const dateOf = (night: string) => new Date(`${night}T00:00:00Z`);

/** "Mon 9 Nov". */
export function nightShort(night: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(dateOf(night));
}

/** "Monday". */
export function nightWeekday(night: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" }).format(dateOf(night));
}
