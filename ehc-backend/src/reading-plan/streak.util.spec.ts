import { addDays, daysBetween, localDate, toDateColumn } from './local-date.util';
import { advanceStreak, paceDelta, type StreakState } from './streak.util';

/**
 * Section 14, tests 4 and 5 of the specification.
 */
const FRESH: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastReadOn: null,
  graceUsedOn: null,
};

describe('local dates', () => {
  it('records tomorrow in Lagos when the clock says 23:30 UTC', () => {
    // The trap, exactly as written in the specification. A member reading at
    // 00:30 in Lagos is at 23:30 UTC the day before. Recording the UTC date
    // would break a streak that was never broken and re-show the same reading.
    const at = new Date('2026-09-08T23:30:00Z');

    expect(localDate('Africa/Lagos', at)).toBe('2026-09-09');
    expect(localDate('UTC', at)).toBe('2026-09-08');
  });

  it('handles a zone behind UTC in the other direction', () => {
    const at = new Date('2026-09-09T02:00:00Z');
    expect(localDate('America/New_York', at)).toBe('2026-09-08');
    expect(localDate('Africa/Lagos', at)).toBe('2026-09-09');
  });

  it('crosses a month and a year end correctly', () => {
    expect(localDate('Africa/Lagos', new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('measures whole days between dates', () => {
    expect(daysBetween('2026-09-01', '2026-10-01')).toBe(30);
    expect(daysBetween('2026-09-09', '2026-09-09')).toBe(0);
  });

  it('writes a DATE column at midnight UTC so the stored day cannot shift', () => {
    expect(toDateColumn('2026-09-09').toISOString()).toBe('2026-09-09T00:00:00.000Z');
  });
});

describe('advanceStreak', () => {
  it('starts at one on a first reading', () => {
    expect(advanceStreak(FRESH, '2026-09-09')).toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      lastReadOn: '2026-09-09',
    });
  });

  it('increments on consecutive days', () => {
    let state = advanceStreak(FRESH, '2026-09-07');
    state = advanceStreak(state, '2026-09-08');
    state = advanceStreak(state, '2026-09-09');

    expect(state.currentStreak).toBe(3);
    expect(state.longestStreak).toBe(3);
  });

  it('does not compound when two days are completed on the same date', () => {
    // Catching up on four readings in one sitting is four days of the plan, not
    // four days of faithfulness.
    const first = advanceStreak(FRESH, '2026-09-09');
    const second = advanceStreak(first, '2026-09-09');

    expect(second.currentStreak).toBe(1);
    expect(second).toBe(first);
  });

  it('carries the streak through exactly one missed day', () => {
    // Read Monday, miss Tuesday, read Wednesday. Sixty days of faithfulness
    // should not be erased by one bad night.
    const monday: StreakState = {
      currentStreak: 60,
      longestStreak: 60,
      lastReadOn: '2026-09-07',
      graceUsedOn: null,
    };

    const wednesday = advanceStreak(monday, '2026-09-09');

    expect(wednesday.currentStreak).toBe(61);
    expect(wednesday.graceUsedOn).toBe('2026-09-09');
  });

  it('resets after two missed days', () => {
    const state: StreakState = {
      currentStreak: 60,
      longestStreak: 60,
      lastReadOn: '2026-09-06',
      graceUsedOn: null,
    };

    const resumed = advanceStreak(state, '2026-09-09');

    expect(resumed.currentStreak).toBe(1);
    // The record of what was achieved survives the reset.
    expect(resumed.longestStreak).toBe(60);
  });

  it('allows the grace only once in thirty days', () => {
    const used: StreakState = {
      currentStreak: 10,
      longestStreak: 10,
      lastReadOn: '2026-09-07',
      graceUsedOn: '2026-08-25', // fifteen days ago
    };

    const second = advanceStreak(used, '2026-09-09');

    expect(second.currentStreak).toBe(1);
    expect(second.graceUsedOn).toBe('2026-08-25');
  });

  it('offers the grace again once the window has passed', () => {
    const used: StreakState = {
      currentStreak: 10,
      longestStreak: 10,
      lastReadOn: '2026-09-07',
      graceUsedOn: '2026-08-05', // thirty five days ago
    };

    const second = advanceStreak(used, '2026-09-09');

    expect(second.currentStreak).toBe(11);
    expect(second.graceUsedOn).toBe('2026-09-09');
  });

  it('keeps the longest streak as a high water mark', () => {
    const state: StreakState = {
      currentStreak: 3,
      longestStreak: 42,
      lastReadOn: '2026-09-08',
      graceUsedOn: null,
    };

    expect(advanceStreak(state, '2026-09-09').longestStreak).toBe(42);
  });
});

describe('paceDelta', () => {
  it('reports drift for encouragement, not debt', () => {
    expect(paceDelta(50, 43)).toBe(7);
    expect(paceDelta(43, 43)).toBe(0);
    // Reading ahead is allowed and shows as negative drift.
    expect(paceDelta(40, 43)).toBe(-3);
  });
});
