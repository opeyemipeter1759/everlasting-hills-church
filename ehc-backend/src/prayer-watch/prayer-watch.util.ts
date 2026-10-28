/** Africa/Lagos is UTC+1 year-round — no daylight saving to account for. */
const WAT_OFFSET_MS = 60 * 60 * 1000;

/**
 * Combines a watch's anchor date with a slot's "HH:MM" wall time into the
 * actual UTC instant it falls on.
 *
 * A watch runs from 10pm into the next morning, so a slot whose wall time is
 * before noon belongs to the calendar day AFTER `watchDate`, not the same day.
 * `watchDate` itself is a UTC-midnight-of-that-date value (no time-of-day
 * meaning beyond its Y/M/D), matching how PrayerWatch.watchDate is stored.
 */
export function slotDateTime(watchDate: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const dayOffset = h < 12 ? 1 : 0;
  const watMidnightUtc = Date.UTC(watchDate.getUTCFullYear(), watchDate.getUTCMonth(), watchDate.getUTCDate() + dayOffset);
  return new Date(watMidnightUtc + (h * 60 + m) * 60_000 - WAT_OFFSET_MS);
}
