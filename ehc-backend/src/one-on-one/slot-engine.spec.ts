import { computeSlots, localDateKey, wallTime, type SlotEngineInput } from './slot-engine';

// Thursday 12 November 2026. "now" is Monday 2 November, 09:00 Lagos.
const THU = '2026-11-12';
const NOW = wallTime('2026-11-02', 9 * 60);

function base(overrides: Partial<SlotEngineInput> = {}): SlotEngineInput {
  return {
    rules: [{ weekday: 4, startTime: '10:00', endTime: '16:00' }],
    blockedDates: [],
    busy: [],
    sessionsPerDay: {},
    durationMinutes: 60,
    bufferMinutes: 30,
    dailyCap: 3,
    minNoticeHours: 48,
    horizonDays: 28,
    from: THU,
    to: THU,
    now: NOW,
    ...overrides,
  };
}

/** Local "HH:MM" of each start on a date. */
function times(input: SlotEngineInput, date = THU): string[] {
  const slots = computeSlots(input)[date] ?? [];
  return slots.map((s) => new Date(s.startsAt.getTime() + 3_600_000).toISOString().slice(11, 16));
}

describe('computeSlots', () => {
  it('lays sessions back to back with the buffer between them', () => {
    expect(times(base())).toEqual(['10:00', '11:30', '13:00', '14:30']);
  });

  it('never runs a session past the end of the window', () => {
    expect(times(base({ rules: [{ weekday: 4, startTime: '10:00', endTime: '12:00' }], durationMinutes: 120 }))).toEqual(['10:00']);
    expect(times(base({ rules: [{ weekday: 4, startTime: '10:00', endTime: '11:30' }], durationMinutes: 120 }))).toEqual([]);
  });

  it('only uses windows on the matching weekday', () => {
    expect(computeSlots(base({ from: '2026-11-09', to: '2026-11-11' }))).toEqual({});
  });

  it('starts after a busy time plus the buffer, on a quarter hour', () => {
    const busy = [{ start: wallTime(THU, 11 * 60), end: wallTime(THU, 12 * 60 + 10) }];
    // 10:00 would end 11:00, touching the 30-minute buffer before 11:00 → skipped.
    // Clear at 12:10 + 30 = 12:40 → rounds to 12:45.
    expect(times(base({ busy }))).toEqual(['12:45', '14:15']);
  });

  it('respects the buffer before a busy time', () => {
    const busy = [{ start: wallTime(THU, 11 * 60 + 30), end: wallTime(THU, 12 * 60) }];
    // 10:00–11:00 then 30 min buffer reaches 11:30 exactly: allowed.
    expect(times(base({ busy }))[0]).toBe('10:00');
  });

  it('hides times inside the minimum notice', () => {
    const now = wallTime(THU, 8 * 60); // same morning
    expect(times(base({ now }))).toEqual([]);
    const dayBefore = wallTime('2026-11-10', 12 * 60); // 48h before Thu 12:00
    expect(times(base({ now: dayBefore }))).toEqual(['13:00', '14:30']);
  });

  it('hides times beyond the booking horizon', () => {
    // Monday 12:00 + 10 days = Thursday 12:00, so only the morning starts remain.
    const now = wallTime('2026-11-02', 12 * 60);
    expect(times(base({ now, horizonDays: 10 }))).toEqual(['10:00', '11:30']);
  });

  it('skips blocked days and days already at the daily cap', () => {
    expect(times(base({ blockedDates: [THU] }))).toEqual([]);
    expect(times(base({ sessionsPerDay: { [THU]: 3 } }))).toEqual([]);
    expect(times(base({ sessionsPerDay: { [THU]: 2 } }))).toHaveLength(4);
  });

  it('merges several windows on one day', () => {
    const rules = [
      { weekday: 4, startTime: '10:00', endTime: '13:00' },
      { weekday: 4, startTime: '14:00', endTime: '16:00' },
    ];
    expect(times(base({ rules }))).toEqual(['10:00', '11:30', '14:00']);
  });

  it('returns only dates that have openings, across a range', () => {
    const result = computeSlots(base({ from: '2026-11-02', to: '2026-11-30' }));
    expect(Object.keys(result)).toEqual(['2026-11-05', '2026-11-12', '2026-11-19', '2026-11-26']);
  });
});

describe('date helpers', () => {
  it('converts between Lagos wall time and UTC', () => {
    expect(wallTime(THU, 10 * 60).toISOString()).toBe('2026-11-12T09:00:00.000Z');
    expect(localDateKey(new Date('2026-11-12T23:30:00.000Z'))).toBe('2026-11-13');
  });
});
