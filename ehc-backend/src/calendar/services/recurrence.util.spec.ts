import {
  buildGatheringOccurrenceStart,
  isSupportedRecurrenceRule,
  localCalendarDate,
  ruleOccursOn,
} from './recurrence.util';

/**
 * These cover the bug this helper exists to prevent: a recurring gathering
 * defined as "05:30 in Lagos" must not drift when the server, the database or
 * the member sit in different offsets.
 */
describe('buildGatheringOccurrenceStart', () => {
  /** Prisma returns a DATE column as UTC midnight. */
  const dateCol = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  it('treats the stored time as Lagos wall clock, not as UTC', () => {
    const start = buildGatheringOccurrenceStart(dateCol('2026-08-19'), '05:30');

    // Lagos is UTC+1, so 05:30 local is 04:30Z. Reading the stored time as UTC
    // would give 05:30Z and put the prayer meeting an hour late for everyone.
    expect(start.toISOString()).toBe('2026-08-19T04:30:00.000Z');
  });

  it('keeps the calendar date when the wall time is early morning', () => {
    // The failure mode here is a naive local-time constructor rolling the date
    // back a day on a server west of Greenwich.
    const start = buildGatheringOccurrenceStart(dateCol('2026-01-01'), '00:30');
    expect(start.toISOString()).toBe('2025-12-31T23:30:00.000Z');
  });

  it('has no daylight saving shift across the year in Lagos', () => {
    // Nigeria stays on UTC+1 year round. Same wall time in January and July
    // must map to the same offset; a hardcoded northern-hemisphere DST rule
    // would break one of these.
    const january = buildGatheringOccurrenceStart(dateCol('2026-01-15'), '05:30');
    const july = buildGatheringOccurrenceStart(dateCol('2026-07-15'), '05:30');

    expect(january.toISOString()).toBe('2026-01-15T04:30:00.000Z');
    expect(july.toISOString()).toBe('2026-07-15T04:30:00.000Z');
  });

  it('applies the correct offset for a timezone that does observe DST', () => {
    // Guards the generic path: the offset is looked up per instant rather than
    // assumed, so a tenant outside Nigeria still gets the right wall time.
    const winter = buildGatheringOccurrenceStart(dateCol('2026-01-15'), '09:00', 'Europe/London');
    const summer = buildGatheringOccurrenceStart(dateCol('2026-07-15'), '09:00', 'Europe/London');

    expect(winter.toISOString()).toBe('2026-01-15T09:00:00.000Z'); // GMT
    expect(summer.toISOString()).toBe('2026-07-15T08:00:00.000Z'); // BST, UTC+1
  });

  it('handles midnight without rolling the day forward', () => {
    const start = buildGatheringOccurrenceStart(dateCol('2026-03-10'), '00:00');
    expect(start.toISOString()).toBe('2026-03-09T23:00:00.000Z');
  });
});

describe('isSupportedRecurrenceRule', () => {
  it('accepts the rules the dispatcher can evaluate', () => {
    expect(isSupportedRecurrenceRule('FREQ=DAILY')).toBe(true);
    expect(isSupportedRecurrenceRule('FREQ=WEEKLY')).toBe(true);
    expect(isSupportedRecurrenceRule('FREQ=WEEKLY;BYDAY=TU,TH')).toBe(true);
  });

  it('is case-insensitive, as RFC 5545 property names are', () => {
    expect(isSupportedRecurrenceRule('freq=weekly;byday=su')).toBe(true);
  });

  it('rejects a frequency nothing downstream can expand', () => {
    // The point of the whole predicate: a monthly rule renders fine in the .ics
    // feed but would never fire a reminder, so it must not be storable.
    expect(isSupportedRecurrenceRule('FREQ=MONTHLY')).toBe(false);
    expect(isSupportedRecurrenceRule('FREQ=YEARLY')).toBe(false);
    expect(isSupportedRecurrenceRule('')).toBe(false);
  });

  it('rejects a malformed weekday', () => {
    expect(isSupportedRecurrenceRule('FREQ=WEEKLY;BYDAY=TU,XX')).toBe(false);
  });
});

describe('ruleOccursOn', () => {
  const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
  const anchor = date('2026-08-19'); // a Wednesday

  it('matches every day for a daily rule', () => {
    expect(ruleOccursOn('FREQ=DAILY', anchor, date('2026-08-19'))).toBe('yes');
    expect(ruleOccursOn('FREQ=DAILY', anchor, date('2026-08-20'))).toBe('yes');
  });

  it('never matches before the anchor date', () => {
    // A gathering that starts next month must not show up as live today.
    expect(ruleOccursOn('FREQ=DAILY', anchor, date('2026-08-18'))).toBe('no');
  });

  it('includes the anchor date itself', () => {
    expect(ruleOccursOn('FREQ=WEEKLY', anchor, anchor)).toBe('yes');
  });

  it('falls back to the anchor weekday when BYDAY is absent', () => {
    expect(ruleOccursOn('FREQ=WEEKLY', anchor, date('2026-08-26'))).toBe('yes'); // Wed
    expect(ruleOccursOn('FREQ=WEEKLY', anchor, date('2026-08-27'))).toBe('no'); // Thu
  });

  it('honours BYDAY over the anchor weekday', () => {
    const rule = 'FREQ=WEEKLY;BYDAY=TU,TH';
    expect(ruleOccursOn(rule, anchor, date('2026-08-20'))).toBe('yes'); // Thu
    expect(ruleOccursOn(rule, anchor, date('2026-08-25'))).toBe('yes'); // Tue
    expect(ruleOccursOn(rule, anchor, date('2026-08-26'))).toBe('no'); // Wed, the anchor day
  });

  it('reports an unreadable rule as unsupported rather than as a miss', () => {
    // Callers apply opposite policies to this, so it must not collapse to 'no'.
    expect(ruleOccursOn('FREQ=MONTHLY;BYMONTHDAY=1', anchor, date('2026-09-01'))).toBe(
      'unsupported',
    );
  });

  it('still refuses an unsupported rule before its anchor', () => {
    expect(ruleOccursOn('FREQ=MONTHLY', anchor, date('2026-08-01'))).toBe('no');
  });
});

describe('localCalendarDate', () => {
  it('returns the calendar date in the target timezone, not in UTC', () => {
    // 23:30Z is already the next day in Lagos. Walking UTC dates instead would
    // look at the wrong day for the last hour of every day.
    const instant = new Date('2026-08-19T23:30:00.000Z');
    expect(localCalendarDate(instant, 'Africa/Lagos').toISOString()).toBe(
      '2026-08-20T00:00:00.000Z',
    );
  });

  it('rolls backwards for a timezone west of UTC', () => {
    const instant = new Date('2026-08-20T02:00:00.000Z');
    expect(localCalendarDate(instant, 'America/New_York').toISOString()).toBe(
      '2026-08-19T00:00:00.000Z',
    );
  });

  it('normalises to midnight so the result is a pure calendar date', () => {
    const instant = new Date('2026-08-19T14:07:33.123Z');
    const result = localCalendarDate(instant, 'Africa/Lagos');
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
  });
});
