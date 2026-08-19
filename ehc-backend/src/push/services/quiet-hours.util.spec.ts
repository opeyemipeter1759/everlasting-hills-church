import { isWithinQuietHours, localMinutes } from './quiet-hours.util';

/** 21:30 Lagos on 19 Aug 2026 (Lagos is UTC+1). */
const at = (utcHour: number, utcMinute = 0) =>
  new Date(Date.UTC(2026, 7, 19, utcHour, utcMinute, 0));

describe('localMinutes', () => {
  it('reads the clock in the target zone, not the server zone', () => {
    // 04:30Z is 05:30 in Lagos.
    expect(localMinutes(at(4, 30), 'Africa/Lagos')).toBe(5 * 60 + 30);
  });

  it('returns 0 at local midnight rather than 1440', () => {
    // 23:00Z is 00:00 Lagos the next day.
    expect(localMinutes(at(23), 'Africa/Lagos')).toBe(0);
  });
});

describe('isWithinQuietHours', () => {
  const LAGOS = 'Africa/Lagos';

  it('is false when no window is set', () => {
    expect(isWithinQuietHours(at(2), null, null, LAGOS)).toBe(false);
    expect(isWithinQuietHours(at(2), '22:00', null, LAGOS)).toBe(false);
  });

  describe('window that wraps midnight (22:00 to 06:00)', () => {
    const start = '22:00';
    const end = '06:00';

    it('suppresses late at night', () => {
      // 23:00 Lagos = 22:00Z
      expect(isWithinQuietHours(at(22), start, end, LAGOS)).toBe(true);
    });

    it('suppresses in the small hours', () => {
      // 02:00 Lagos = 01:00Z. This is the case a naive start<=now<end misses,
      // letting a notification through at 2am.
      expect(isWithinQuietHours(at(1), start, end, LAGOS)).toBe(true);
    });

    it('allows during the day', () => {
      // 13:00 Lagos = 12:00Z
      expect(isWithinQuietHours(at(12), start, end, LAGOS)).toBe(false);
    });

    it('allows exactly at the end bound', () => {
      // 06:00 Lagos = 05:00Z — the window is half-open, so quiet ends here.
      expect(isWithinQuietHours(at(5), start, end, LAGOS)).toBe(false);
    });

    it('suppresses exactly at the start bound', () => {
      // 22:00 Lagos = 21:00Z
      expect(isWithinQuietHours(at(21), start, end, LAGOS)).toBe(true);
    });
  });

  describe('same-day window (13:00 to 15:00)', () => {
    it('suppresses inside', () => {
      expect(isWithinQuietHours(at(13), '13:00', '15:00', LAGOS)).toBe(true); // 14:00 Lagos
    });

    it('allows outside', () => {
      expect(isWithinQuietHours(at(20), '13:00', '15:00', LAGOS)).toBe(false); // 21:00 Lagos
    });
  });

  it('treats equal bounds as no window rather than all day', () => {
    // A UI slip that saves 08:00 to 08:00 must not mute the member permanently.
    expect(isWithinQuietHours(at(12), '08:00', '08:00', LAGOS)).toBe(false);
  });

  it('fails open on a malformed window', () => {
    expect(isWithinQuietHours(at(2), 'not-a-time', '06:00', LAGOS)).toBe(false);
    expect(isWithinQuietHours(at(2), '25:00', '06:00', LAGOS)).toBe(false);
  });

  it('fails open on an unknown timezone rather than muting everything', () => {
    expect(isWithinQuietHours(at(2), '22:00', '06:00', 'Not/AZone')).toBe(false);
  });

  it('evaluates against the member timezone, not the server', () => {
    // 01:00Z is 02:00 in Lagos (quiet) but 20:00 the previous day in New York
    // (not quiet). Same instant, same window, different answers.
    expect(isWithinQuietHours(at(1), '22:00', '06:00', 'Africa/Lagos')).toBe(true);
    expect(isWithinQuietHours(at(1), '22:00', '06:00', 'America/New_York')).toBe(false);
  });
});
