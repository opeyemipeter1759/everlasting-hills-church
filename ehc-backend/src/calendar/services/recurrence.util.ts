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
