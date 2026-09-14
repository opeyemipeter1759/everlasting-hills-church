/**
 * Birthdays run on the church's local day: West Africa Time, UTC+1, with no
 * daylight saving. The dashboard's birthday card and the site-wide celebration
 * both use this, so "Today 🎂" and the balloons can never disagree about which
 * day it is.
 *
 * A date of birth is a calendar date stored as UTC midnight, so its month and
 * day are read in UTC. A 29 February birthday falls on 1 March in other years,
 * which is how Date.UTC rolls the date over.
 */
const WAT_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** Days until the next birthday, 0 on the day itself, null for no usable date. */
export function daysUntilBirthday(
  dateOfBirth: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const wat = new Date(now.getTime() + WAT_OFFSET_MS);
  const year = wat.getUTCFullYear();
  const today = Date.UTC(year, wat.getUTCMonth(), wat.getUTCDate());
  let next = Date.UTC(year, dob.getUTCMonth(), dob.getUTCDate());
  // Already past this year: count to next year's, so late December can see a
  // birthday in early January coming.
  if (next < today) next = Date.UTC(year + 1, dob.getUTCMonth(), dob.getUTCDate());
  return Math.round((next - today) / DAY_MS);
}

export function isBirthdayToday(
  dateOfBirth: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return daysUntilBirthday(dateOfBirth, now) === 0;
}

/** Today's date in Lagos as YYYY-MM-DD, to remember a celebration has played. */
export function watDate(now: Date = new Date()): string {
  return new Date(now.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}
