/**
 * "When is it?" phrasing for the member-facing card.
 *
 * Split out from the component and given an explicit `now` so it can be tested
 * without freezing the clock, and so every caller renders the same wording.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * A short phrase for how far away `iso` is: "in 25 min", "in 2 hours",
 * "tomorrow", "in 3 days".
 *
 * Deliberately coarse. The card already shows the exact clock time, so a
 * ticking "in 24 minutes, 13 seconds" would add noise and force a per-second
 * re-render for information nobody acts on.
 */
export function formatLeadTime(iso: string, now: Date = new Date()): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "";

  const delta = target - now.getTime();
  if (delta <= 0) return "now";

  if (delta < MINUTE) return "in under a minute";
  if (delta < HOUR) {
    const minutes = Math.round(delta / MINUTE);
    return `in ${minutes} min`;
  }
  if (delta < DAY) {
    const hours = Math.round(delta / HOUR);
    return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  }

  const days = Math.round(delta / DAY);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/**
 * How much of a live occurrence is left: "45 min left", "ends soon".
 *
 * Returns an empty string once the end has passed, so a card whose server data
 * is a minute stale degrades to showing nothing rather than "-3 min left".
 */
export function formatTimeRemaining(endsAtIso: string, now: Date = new Date()): string {
  const end = new Date(endsAtIso).getTime();
  if (Number.isNaN(end)) return "";

  const delta = end - now.getTime();
  if (delta <= 0) return "";
  if (delta < 5 * MINUTE) return "ends soon";

  if (delta < HOUR) return `${Math.round(delta / MINUTE)} min left`;

  const hours = Math.floor(delta / HOUR);
  const minutes = Math.round((delta % HOUR) / MINUTE);
  return minutes === 0 ? `${hours} hr left` : `${hours} hr ${minutes} min left`;
}

/**
 * The occurrence's clock time in the gathering's own timezone.
 *
 * Rendered from the gathering's zone rather than the browser's on purpose: the
 * meeting happens at 5:30 in Lagos whether or not the member is travelling, and
 * a member abroad who sees "5:30 AM" alongside a "in 2 hours" lead time can act
 * on both. The zone label is shown next to it by the card.
 */
export function formatOccurrenceTime(iso: string, timezone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  // Uppercased explicitly: ICU renders the day period lower-case in several
  // English locales, and "5:30 am" reads as a typo next to the rest of the UI.
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };

  try {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone })
      .format(date)
      .toUpperCase();
  } catch {
    // Unknown zone: fall back to the browser's rather than rendering nothing.
    return new Intl.DateTimeFormat("en-US", options).format(date).toUpperCase();
  }
}

/** "Today", "Tomorrow", or "Tue, 25 Aug" — the day an occurrence falls on, in its own zone. */
export function formatOccurrenceDay(iso: string, timezone: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const dayKey = (value: Date) => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(value);
    } catch {
      return value.toISOString().slice(0, 10);
    }
  };

  const target = dayKey(date);
  if (target === dayKey(now)) return "Today";
  if (target === dayKey(new Date(now.getTime() + DAY))) return "Tomorrow";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return target;
  }
}
