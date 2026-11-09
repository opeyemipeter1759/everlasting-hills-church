import { judgeMember, type RiskSunday } from './member-risk.util';

// Ten Sundays, newest first: 8 Nov back to 6 Sep (midnight Lagos = 23:00Z the day before).
const SUNDAYS: RiskSunday[] = Array.from({ length: 10 }, (_, i) => ({
  id: `sun-${i}`,
  scheduledAt: new Date(Date.UTC(2026, 10, 7 - i * 7, 23)),
}));
const LONG_AGO = new Date('2026-01-01T00:00:00Z');
const came = (...idx: number[]) => new Set(idx.map((i) => `sun-${i}`));

describe('judgeMember', () => {
  it('flags someone who has missed the last three Sundays, with the real count', () => {
    expect(judgeMember({ id: 'm', joinedAt: LONG_AGO }, SUNDAYS, came(5, 6), true)).toEqual({
      kind: 'in-a-row',
      missed: 5,
      attended: 2,
      eligible: 8,
    });
  });

  it('leaves alone someone who came last Sunday, even after a gap', () => {
    expect(judgeMember({ id: 'm', joinedAt: LONG_AGO }, SUNDAYS, came(0, 3, 4, 5), true)).toBeNull();
  });

  it('flags someone who comes to fewer than half of the last eight', () => {
    expect(judgeMember({ id: 'm', joinedAt: LONG_AGO }, SUNDAYS, came(0, 4, 8, 9), true)).toEqual({
      kind: 'low-rate',
      attended: 2,
      eligible: 8,
    });
  });

  it('only counts Sundays since the member joined', () => {
    // Joined the morning of 25 Oct's Sunday (index 2): three Sundays to judge, came to one.
    const joinedAt = new Date('2026-10-25T08:00:00Z');
    expect(judgeMember({ id: 'm', joinedAt }, SUNDAYS, came(0), true)).toBeNull();
    expect(judgeMember({ id: 'm', joinedAt }, SUNDAYS, new Set(), true)).toEqual({ kind: 'in-a-row', missed: 3, attended: 0, eligible: 3 });
  });

  it('gives a new member a few Sundays before judging them', () => {
    const joinedAt = new Date('2026-11-02T10:00:00Z');
    expect(judgeMember({ id: 'm', joinedAt }, SUNDAYS, new Set(), false)).toBeNull();
  });

  it('calls out someone who has never checked in once they have had three Sundays', () => {
    expect(judgeMember({ id: 'm', joinedAt: LONG_AGO }, SUNDAYS, new Set(), false)).toEqual({ kind: 'never', eligible: 10 });
  });
});
