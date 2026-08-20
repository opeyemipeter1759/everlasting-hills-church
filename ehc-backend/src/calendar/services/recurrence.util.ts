import { CHURCH_TIMEZONE } from './ics-builder.service';

/**
 * Combines a RecurringGathering's anchor date with its local wall-clock start
 * time to produce the instant used as DTSTART.
 *
 * The two are stored separately on purpose. A recurring gathering means "07:00
 * in Lagos, every day", not "06:00 UTC, every day" — those are the same thing
 * only while the offset never changes. Storing one UTC timestamp bakes today's
 * offset into every future occurrence, which is the classic recurring-event bug.
 *
 * Nigeria is UTC+1 year round with no daylight saving, so the offset lookup
 * below currently always yields +01:00. It is computed rather than hardcoded so
 * that a tenant in a DST-observing timezone gets the right answer instead of a
 * silently wrong one an hour off for half the year.
 */
export function buildGatheringOccurrenceStart(
  startDate: Date,
  startTime: string,
  timezone: string = CHURCH_TIMEZONE,
): Date {
  const [hours, minutes] = startTime.split(':').map(Number);

  // startDate is a DATE column, so Prisma hands it back at UTC midnight. Read
  // the calendar date off the UTC fields; using local getters would roll the
  // date backwards for any server west of Greenwich.
  const year = startDate.getUTCFullYear();
  const month = startDate.getUTCMonth();
  const day = startDate.getUTCDate();

  // First approximation: treat the wall time as if it were UTC, then correct by
  // the zone's actual offset at that moment.
  const asUtc = Date.UTC(year, month, day, hours, minutes, 0, 0);
  const offsetMs = timezoneOffsetMs(new Date(asUtc), timezone);

  return new Date(asUtc - offsetMs);
}

/**
 * The offset of `timezone` at `instant`, in milliseconds east of UTC.
 *
 * Uses Intl rather than a timezone library: Node ships the full IANA database,
 * so formatting the instant in the target zone and reading it back as if it
 * were UTC gives the offset directly, with DST handled by the platform.
 */
function timezoneOffsetMs(instant: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }

  // Intl renders hour 24 for midnight in some locales/versions; normalise so
  // Date.UTC does not roll the day forward.
  const hour = parts.hour === 24 ? 0 : parts.hour;

  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    parts.minute,
    parts.second,
  );

  return asIfUtc - instant.getTime();
}

/** RFC 5545 weekday codes, indexed to line up with `Date#getUTCDay()`. */
const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/**
 * Whether a rule covers a given date.
 *
 * `unsupported` is a distinct answer rather than a `false`, because the two
 * callers want opposite things from it: the dispatcher fires anyway so a rule
 * it cannot read is loud instead of silently dead, while the gatherings view
 * shows nothing so it never advertises an occurrence it cannot place.
 */
export type RuleMatch = 'yes' | 'no' | 'unsupported';

/** Splits an RRULE into upper-cased key/value pairs. Unknown parts are ignored. */
export function parseRecurrenceRule(rule: string): Record<string, string> {
  return Object.fromEntries(
    rule
      .split(';')
      .map((part) => part.split('='))
      .filter((part) => part.length === 2)
      .map(([key, value]) => [key.toUpperCase(), value.toUpperCase()]),
  );
}

/**
 * Whether the rule is one this codebase can actually evaluate.
 *
 * Used to reject a rule at write time. A monthly rule would render correctly in
 * the calendar feed — ical-generator passes it through verbatim — but would
 * never fire a reminder and would never resolve to a next occurrence, so it is
 * better refused than accepted into a state only half the system understands.
 */
export function isSupportedRecurrenceRule(rule: string): boolean {
  const parts = parseRecurrenceRule(rule);
  if (parts.FREQ === 'DAILY') return true;
  if (parts.FREQ !== 'WEEKLY') return false;
  if (!parts.BYDAY) return true;
  return parts.BYDAY.split(',').every((day) => WEEKDAY_CODES.includes(day as never));
}

/**
 * Whether `date` is an occurrence of `rule` anchored at `anchor`.
 *
 * Both dates are UTC-midnight `Date`s standing for a calendar date — the same
 * convention Prisma uses for a DATE column and the one
 * `buildGatheringOccurrenceStart` consumes. Keeping every date in that one
 * shape is what lets the weekday be read with `getUTCDay()` without a timezone
 * argument: the caller has already resolved which calendar day it is asking
 * about.
 */
export function ruleOccursOn(rule: string, anchor: Date, date: Date): RuleMatch {
  // The recurrence has not started yet.
  if (date.getTime() < startOfUtcDay(anchor).getTime()) return 'no';

  const parts = parseRecurrenceRule(rule);
  if (parts.FREQ === 'DAILY') return 'yes';

  if (parts.FREQ === 'WEEKLY') {
    const code = WEEKDAY_CODES[date.getUTCDay()];
    // No BYDAY means "the same weekday as DTSTART".
    if (!parts.BYDAY) return code === WEEKDAY_CODES[anchor.getUTCDay()] ? 'yes' : 'no';
    return parts.BYDAY.split(',').includes(code) ? 'yes' : 'no';
  }

  return 'unsupported';
}

/**
 * The calendar date `instant` falls on in `timezone`, as a UTC-midnight `Date`.
 *
 * Needed because "today" is a question about a place, not about UTC: at 23:30Z
 * it is already tomorrow in Lagos, and a loop over UTC dates would look at the
 * wrong day for the last hour of every day.
 */
export function localCalendarDate(instant: Date, timezone: string = CHURCH_TIMEZONE): Date {
  const parts: Record<string, number> = {};
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

/** Strips the time off a UTC-midnight-convention date, defensively. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Shifts a calendar date by whole days, staying on the UTC-midnight convention. */
export function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}
