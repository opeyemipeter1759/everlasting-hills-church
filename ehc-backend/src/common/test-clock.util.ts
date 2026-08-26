import { Logger } from '@nestjs/common';

const logger = new Logger('TestClock');
let warned = false;

/**
 * The current time, honouring the ATTENDANCE_TEST_NOW override — but never
 * returning an Invalid Date.
 *
 * This exists because of a live incident. ATTENDANCE_TEST_NOW was set to a value
 * `new Date()` could not parse, so every consumer got an Invalid Date, and an
 * Invalid Date does not announce itself: every comparison against it is simply
 * false. The headcount screen refused every date an usher picked with "you can
 * only record a headcount for a date that has already occurred", including dates
 * weeks in the past, and the attendance window that governs member check-in was
 * doing the same arithmetic. Nothing was logged, because nothing threw — until
 * something called toISOString() on it and turned the silence into a 500.
 *
 * A testing override that cannot be parsed is a mistake, not an instruction, so
 * it is ignored in favour of the real clock and reported once per process. The
 * override is deliberately NOT validated at boot: a bad value would then keep a
 * new revision from starting, which hides the problem behind a stale deploy
 * rather than fixing it.
 */
export function resolveNow(override: string | undefined): Date {
  const raw = override?.trim();
  if (!raw) return new Date();

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    if (!warned) {
      warned = true;
      logger.error(
        `ATTENDANCE_TEST_NOW is set to "${raw}", which is not a parseable date — ignoring it and using the real clock. ` +
          'Clear the variable, or set it to an ISO timestamp like 2026-08-16T09:00:00Z.',
      );
    }
    return new Date();
  }

  return parsed;
}

/** Test seam: lets a spec assert the warning fires once per process. */
export function resetTestClockWarning(): void {
  warned = false;
}
