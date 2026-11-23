import { firstSundayOfDecember, giftExchangeTarget, toLagosIso } from './gift-exchange-target';

describe('the gift exchange countdown target', () => {
  it('is the first Sunday of December at midnight in Lagos', () => {
    expect(toLagosIso(firstSundayOfDecember(2026))).toBe('2026-12-06T00:00:00.000+01:00');
    expect(firstSundayOfDecember(2026).toISOString()).toBe('2026-12-05T23:00:00.000Z');
    // December 1 is itself a Sunday in 2024 and 2030.
    expect(toLagosIso(firstSundayOfDecember(2024))).toBe('2024-12-01T00:00:00.000+01:00');
    expect(toLagosIso(firstSundayOfDecember(2030))).toBe('2030-12-01T00:00:00.000+01:00');
    expect(toLagosIso(firstSundayOfDecember(2027))).toBe('2027-12-05T00:00:00.000+01:00');
  });

  it("uses this year's date until it has passed", () => {
    expect(toLagosIso(giftExchangeTarget(new Date('2026-11-15T10:00:00Z')))).toBe('2026-12-06T00:00:00.000+01:00');
  });

  it('keeps pointing at the day itself while it is that Sunday, so the countdown shows the day has come', () => {
    expect(toLagosIso(giftExchangeTarget(new Date('2026-12-06T12:00:00Z')))).toBe('2026-12-06T00:00:00.000+01:00');
  });

  it("moves to next year's once the day is over", () => {
    expect(toLagosIso(giftExchangeTarget(new Date('2026-12-06T23:00:00Z')))).toBe('2027-12-05T00:00:00.000+01:00');
  });

  it('uses Lagos time to decide the year (New Year’s Eve 23:30 UTC is already January in Lagos)', () => {
    expect(toLagosIso(giftExchangeTarget(new Date('2026-12-31T23:30:00Z')))).toBe('2027-12-05T00:00:00.000+01:00');
  });

  it('uses GIFT_EXCHANGE_TARGET_DATE when it is set, even if it has passed', () => {
    expect(toLagosIso(giftExchangeTarget(new Date('2026-11-15T10:00:00Z'), '2026-11-20T18:00:00+01:00'))).toBe('2026-11-20T18:00:00.000+01:00');
    expect(toLagosIso(giftExchangeTarget(new Date('2027-01-01T00:00:00Z'), '2026-11-20T17:00:00Z'))).toBe('2026-11-20T18:00:00.000+01:00');
  });
});
