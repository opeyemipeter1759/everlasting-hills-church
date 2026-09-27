/** Lagos is UTC+1 all year (no daylight saving). */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** Midnight on the 1st of the current month in Lagos, as a UTC instant. */
export function startOfLagosMonth(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), 1) - LAGOS_OFFSET_MS);
}

/** Midnight on the 1st of the current quarter in Lagos. */
export function startOfLagosQuarter(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const month = Math.floor(lagos.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(lagos.getUTCFullYear(), month, 1) - LAGOS_OFFSET_MS);
}
