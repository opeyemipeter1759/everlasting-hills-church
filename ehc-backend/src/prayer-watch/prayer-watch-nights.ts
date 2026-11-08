import { slotDateTime } from './prayer-watch.util';

/**
 * Watch nights. The watch runs 10pm to 6am, Monday to Saturday evenings, Lagos
 * time; Sunday is rest. A night is named by the evening it begins, "YYYY-MM-DD",
 * so 3am on a Tuesday is still Monday night.
 */

const WAT_OFFSET_MS = 3_600_000;
const DAY_MS = 86_400_000;

export const nightDateValue = (night: string): Date => new Date(`${night}T00:00:00Z`);
export const nightKey = (date: Date): string => date.toISOString().slice(0, 10);

/** The evening an instant belongs to: before noon counts as the night before. */
export function lagosNightOf(instant: Date): string {
  const local = new Date(instant.getTime() + WAT_OFFSET_MS);
  if (local.getUTCHours() < 12) local.setUTCDate(local.getUTCDate() - 1);
  return nightKey(local);
}

export function isWatchNight(night: string): boolean {
  return nightDateValue(night).getUTCDay() !== 0;
}

/** The latest night on which a watch starting at `startTime` has already begun. */
export function latestNightStarted(now: Date, startTime: string): string {
  const night = lagosNightOf(now);
  if (slotDateTime(nightDateValue(night), startTime) <= now) return night;
  return nightKey(new Date(nightDateValue(night).getTime() - DAY_MS));
}

/** `count` watch nights ending at `fromNight` (Sundays skipped), newest first. */
export function recentWatchNights(fromNight: string, count: number): string[] {
  const nights: string[] = [];
  for (let t = nightDateValue(fromNight).getTime(); nights.length < count; t -= DAY_MS) {
    const night = nightKey(new Date(t));
    if (isWatchNight(night)) nights.push(night);
  }
  return nights;
}

/** Monday of the week a night falls in. */
export function nightWeekStart(night: string): string {
  const d = nightDateValue(night);
  return nightKey(new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS));
}

/** Night hours run from 8pm to 9am; anything in the day isn't part of a watch. */
const inNight = (hhmm: string) => {
  const h = Number(hhmm.slice(0, 2));
  return h >= 20 || h < 9;
};

/** Minutes between two "HH:MM" wall times on a night, or null if they don't make a watch. */
export function watchMinutes(night: string, start: string, end: string): number | null {
  if (!inNight(start) || !inNight(end)) return null;
  const ms = slotDateTime(nightDateValue(night), end).getTime() - slotDateTime(nightDateValue(night), start).getTime();
  const minutes = Math.round(ms / 60_000);
  return minutes > 0 && minutes <= 8 * 60 ? minutes : null;
}
