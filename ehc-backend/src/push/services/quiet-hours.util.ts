/**
 * Quiet-hours evaluation.
 *
 * The window is stored as local wall-clock "HH:MM" strings plus an IANA
 * timezone, so it has to be evaluated against the member's own clock, not the
 * server's. The two cases that break naive implementations:
 *
 *   1. A window that wraps midnight (22:00 to 06:00). A simple
 *      `start <= now && now < end` comparison is false for the entire window,
 *      so every notification gets through at 2am.
 *   2. A member whose timezone differs from the server's. Comparing against
 *      server local time silences the wrong hours.
 */

/** Minutes since local midnight for `instant` in `timezone`. */
export function localMinutes(instant: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);

  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    if (part.type === 'hour') hour = Number(part.value);
    if (part.type === 'minute') minute = Number(part.value);
  }
  // Some ICU versions render midnight as hour 24.
  if (hour === 24) hour = 0;

  return hour * 60 + minute;
}

function parseHHMM(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * True when `instant` falls inside the member's quiet window.
 *
 * Returns false when either bound is missing or malformed: an unparseable
 * window must not silently mute every notification the member expects.
 */
export function isWithinQuietHours(
  instant: Date,
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string,
): boolean {
  if (!quietStart || !quietEnd) return false;

  const start = parseHHMM(quietStart);
  const end = parseHHMM(quietEnd);
  if (start === null || end === null) return false;

  // Equal bounds mean a zero-length window, not a 24-hour one. Treating it as
  // all-day would mute the member permanently from a UI slip.
  if (start === end) return false;

  let now: number;
  try {
    now = localMinutes(instant, timezone);
  } catch {
    // Unknown timezone string. Fail open rather than mute.
    return false;
  }

  return start < end
    ? now >= start && now < end // same-day window, e.g. 13:00 to 15:00
    : now >= start || now < end; // wraps midnight, e.g. 22:00 to 06:00
}
