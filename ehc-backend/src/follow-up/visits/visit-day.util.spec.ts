import { BadRequestException } from '@nestjs/common';
import { addDays, lagosDay, parseVisitDay, prettyDay } from './visit-day.util';

describe('visit days', () => {
  it('reads 23:30 UTC on 31 January as 1 February in Lagos', () => {
    expect(lagosDay(new Date('2026-01-31T23:30:00Z'))).toBe('2026-02-01');
    expect(lagosDay(new Date('2026-01-31T22:59:00Z'))).toBe('2026-01-31');
  });

  it('accepts today in Lagos and refuses tomorrow, even just after UTC midnight', () => {
    const now = new Date('2026-03-14T23:30:00Z'); // 00:30 on 15 March in Lagos
    expect(parseVisitDay('2026-03-15', now)).toBe('2026-03-15');
    expect(() => parseVisitDay('2026-03-16', now)).toThrow(BadRequestException);
  });

  it('refuses days that do not exist or are not written YYYY-MM-DD', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '15/03/2026', '2026-3-1', '']) {
      expect(() => parseVisitDay(bad, new Date('2026-12-31T12:00:00Z'))).toThrow(BadRequestException);
    }
  });

  it('steps across month ends and words a day for people', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(prettyDay('2026-01-04')).toBe('4 Jan 2026');
  });
});
