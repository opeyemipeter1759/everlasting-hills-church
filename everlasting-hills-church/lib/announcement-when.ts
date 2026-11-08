/** The church's day: an event "today" means today in Lagos, wherever the reader is. */
const TIME_ZONE = "Africa/Lagos";
const DAY_MS = 86_400_000;

/** A calendar day in Lagos as a UTC midnight timestamp, for counting whole days between dates. */
function lagosDay(date: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, d);
}

function shortDate(date: Date, now: Date, weekday: boolean): string {
  const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    ...(weekday ? { weekday: "short" as const } : {}),
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" as const }),
  }).format(date);
}

export interface AnnouncementWhen {
  /** "Today", "Tomorrow", "Fri 13 Nov" for an event; "Posted 7 Nov" otherwise. */
  label: string;
  /** Whether the label is the event's own date (true) or when it was posted (false). */
  isEvent: boolean;
  /** The event happens today. Never true for a plain announcement. */
  isToday: boolean;
}

/**
 * The date to show on an announcement. One raised from an event shows the
 * event's real date, so "Today" only ever means the event is today. Any other
 * announcement shows the real date it was posted, never "Today", which read
 * as if something were happening today when it was only posted today.
 */
export function announcementWhen(
  a: { createdAt: string; Event?: { startAt?: string | null } | null },
  now: Date = new Date(),
): AnnouncementWhen {
  if (a.Event?.startAt) {
    const start = new Date(a.Event.startAt);
    const days = Math.round((lagosDay(start) - lagosDay(now)) / DAY_MS);
    if (days === 0) return { label: "Today", isEvent: true, isToday: true };
    if (days === 1) return { label: "Tomorrow", isEvent: true, isToday: false };
    return { label: shortDate(start, now, true), isEvent: true, isToday: false };
  }
  return { label: `Posted ${shortDate(new Date(a.createdAt), now, false)}`, isEvent: false, isToday: false };
}
