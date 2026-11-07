const LAGOS = "Africa/Lagos";

/** "2 days", "5 hours", "under an hour". */
export function durationWords(hours: number): string {
  if (hours < 1) return "under an hour";
  if (hours < 36) {
    const h = Math.round(hours);
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  const d = Math.round(hours / 24);
  return d === 1 ? "1 day" : `${d} days`;
}

export function hoursSince(iso: string, now = Date.now()): number {
  return (now - new Date(iso).getTime()) / 3_600_000;
}

/** "26 Oct" for an ISO date ("YYYY-MM-DD"). */
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));
}

/** "1 February 2027" for an instant, in church time. */
export function longDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
}

/** Card chrome shared by every block of the overview. */
export const panel = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]";
export const panelTitle = "text-base font-bold text-[#1A1210] dark:text-white";
export const panelHint = "text-sm text-gray-500 dark:text-white/55";
