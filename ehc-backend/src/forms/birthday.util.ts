const MONTH_INDEX: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * The first-timer form collects a birthday as day + month name (no year).
 * Compose them into an ISO date string (sentinel year 2000 — only day/month
 * are meaningful) so it can be stored on the Visitor and later carried to the
 * Member on conversion. Returns null when either part is missing/invalid.
 */
export function composeBirthdayIso(day?: string, month?: string): string | null {
  if (!day || !month) return null;
  const mi = MONTH_INDEX[month.trim().toLowerCase()];
  const d = parseInt(day, 10);
  if (mi === undefined || !d || d < 1 || d > 31) return null;
  return new Date(Date.UTC(2000, mi, d)).toISOString();
}
