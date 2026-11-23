/** Africa/Lagos is UTC+1 all year (no daylight saving). */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The first Sunday of December, 00:00 in Lagos, as an instant. 2026 → 2026-12-05T23:00:00Z. */
export function firstSundayOfDecember(year: number): Date {
  const dec1 = new Date(Date.UTC(year, 11, 1));
  const day = 1 + ((7 - dec1.getUTCDay()) % 7);
  return new Date(Date.UTC(year, 11, day) - LAGOS_OFFSET_MS);
}

/**
 * When the gift exchange begins. GIFT_EXCHANGE_TARGET_DATE, when set, wins.
 * Otherwise this year's first Sunday of December, or next year's once this
 * year's day is over: on the day itself the countdown still points at it, so
 * members see "The day is here" rather than a fresh year-long countdown.
 */
export function giftExchangeTarget(now: Date, override?: string): Date {
  if (override) return new Date(override);
  const year = new Date(now.getTime() + LAGOS_OFFSET_MS).getUTCFullYear();
  const thisYear = firstSundayOfDecember(year);
  return now.getTime() < thisYear.getTime() + DAY_MS ? thisYear : firstSundayOfDecember(year + 1);
}

/** An instant as a Lagos-time ISO string with its offset: 2026-12-06T00:00:00.000+01:00. */
export function toLagosIso(at: Date): string {
  return new Date(at.getTime() + LAGOS_OFFSET_MS).toISOString().replace('Z', '+01:00');
}
