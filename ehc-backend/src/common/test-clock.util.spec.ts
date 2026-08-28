import { resolveNow, resetTestClockWarning } from './test-clock.util';

/**
 * Regression test for a live incident: ATTENDANCE_TEST_NOW held a value
 * new Date() could not parse, so every consumer compared dates against an
 * Invalid Date. Every comparison came back false, the headcount screen refused
 * every date an usher picked, and nothing was logged because nothing threw.
 */
describe('resolveNow', () => {
  beforeEach(() => resetTestClockWarning());

  it('uses the real clock when the override is unset or blank', () => {
    const before = Date.now();
    expect(resolveNow(undefined).getTime()).toBeGreaterThanOrEqual(before);
    expect(resolveNow('   ').getTime()).toBeGreaterThanOrEqual(before);
  });

  it('honours a parseable override', () => {
    expect(resolveNow('2026-08-16T09:00:00Z').toISOString()).toBe('2026-08-16T09:00:00.000Z');
  });

  it('never returns an Invalid Date, whatever the override says', () => {
    // '0000' is deliberately absent: JS parses it as year 0, so it is a
    // legitimate (if useless) override rather than an unparseable one.
    for (const bad of ['true', 'yesterday', '2026-13-45', 'null']) {
      const now = resolveNow(bad);
      expect(Number.isNaN(now.getTime())).toBe(false);
      // The whole point: an unparseable override must not poison date maths.
      expect(() => now.toISOString()).not.toThrow();
      expect(new Date('2026-08-16').getTime() <= now.getTime()).toBe(true);
    }
  });

  it('reports the bad value once rather than on every request', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    resolveNow('true');
    resolveNow('true');
    resolveNow('true');
    spy.mockRestore();
  });
});
