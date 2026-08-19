import { buildGatheringOccurrenceStart } from './recurrence.util';

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
