import { addDays, fastDay, lagosDate, type FastingRules } from './fasting-day.util';

const FURNACE: FastingRules = {
  startDate: '2026-10-02',
  endDate: '2026-10-31',
  mealTime: '3pm',
  dryFasts: [
    { startDate: '2026-10-03', endDate: '2026-10-04', breakTime: '3pm' },
    { startDate: '2026-10-09', endDate: '2026-10-11', breakTime: '3pm' },
    { startDate: '2026-10-17', endDate: '2026-10-18', breakTime: '3pm' },
    { startDate: '2026-10-23', endDate: '2026-10-25', breakTime: '3pm' },
  ],
  morningTime: '6am',
  eveningTime: '8pm',
  noMorningDays: [0],
  noEveningDays: [6],
  serviceDays: [0],
};

describe("a day of Furnace '26, as the schedule sets it out", () => {
  it('is nothing outside the fast', () => {
    expect(fastDay(FURNACE, '2026-10-01')).toBeNull();
    expect(fastDay(FURNACE, '2026-11-01')).toBeNull();
  });

  it('Day 1 is a one-meal day, and the last meal before the first dry weekend', () => {
    expect(fastDay(FURNACE, '2026-10-02')).toMatchObject({
      dayNumber: 1,
      totalDays: 30,
      kind: 'meal',
      isFirst: true,
      lastMealBefore: { days: 2, startDate: '2026-10-03' },
      morning: '6am morning prayer',
      evening: '8pm evening prayer',
    });
  });

  it('a dry Saturday has no evening session; the Sunday breaks at 3pm and its morning is the service', () => {
    expect(fastDay(FURNACE, '2026-10-03')).toMatchObject({ kind: 'dry', dryDay: 1, dryLength: 2, evening: null });
    expect(fastDay(FURNACE, '2026-10-04')).toMatchObject({ dryDay: 2, breakTime: '3pm', morning: 'Sunday service' });
  });

  it('Thursday 8th is the last meal before the three-day dry fast', () => {
    expect(fastDay(FURNACE, '2026-10-08')?.lastMealBefore).toEqual({ days: 3, startDate: '2026-10-09' });
    expect(fastDay(FURNACE, '2026-10-07')?.lastMealBefore).toBeUndefined();
  });

  it('Day 30 is the closing day', () => {
    expect(fastDay(FURNACE, '2026-10-31')).toMatchObject({ dayNumber: 30, isLast: true, kind: 'meal' });
  });
});

describe('dates', () => {
  it('reads the day in Lagos, an hour ahead of UTC', () => {
    expect(lagosDate(new Date('2026-10-01T22:59:00Z'))).toBe('2026-10-01');
    expect(lagosDate(new Date('2026-10-01T23:00:00Z'))).toBe('2026-10-02');
    expect(addDays('2026-10-01', 1)).toBe('2026-10-02');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });
});
