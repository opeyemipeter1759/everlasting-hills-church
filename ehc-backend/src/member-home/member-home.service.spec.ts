import { Logger } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user';
import { HOME_PLEDGE_CAMPAIGN, MemberHomeService } from './member-home.service';

const actor = { userId: 'u1', email: 'a@b.org', profileId: 'p1', memberId: 'm1' } as AuthUser;

function makeService(overrides: Record<string, Record<string, jest.Mock>> = {}) {
  const ok = (value: unknown) => jest.fn().mockResolvedValue(value);
  const deps = {
    authMe: { getMe: ok({ profileId: 'p1' }) },
    sermonStats: { getMemberBookmarks: ok([]), getMemberListenHistory: ok([]), getSermonStreak: ok(3) },
    overview: { getMemberOverview: ok({ attendance: {} }) },
    announcements: { listFeed: ok([{ id: 'a1' }]) },
    community: { getFeed: ok([]) },
    birthdays: { getCommunityBirthdays: ok([]) },
    spouse: { mine: ok({ status: 'SINGLE' }) },
    pledges: { mine: ok(null) },
    evangelism: { tally: ok({ reached: 4 }) },
    prayerWatch: { getMySignup: ok(null), getPublicView: ok({ id: 'w1', slots: [] }) },
    oneOnOne: { listMine: ok([]) },
    readingPlan: { today: ok({ day: 1 }), subscriptions: ok([]) },
    scripture: { today: ok({ reference: 'John 3:16' }) },
    passages: { translations: ok([{ code: 'KJV' }]) },
    attendanceWindow: { canMark: ok({ canMark: false }) },
    gatherings: { listActive: ok([]) },
    digest: { latest: ok(null) },
    ...overrides,
  };
  const service = new (MemberHomeService as unknown as new (...args: unknown[]) => MemberHomeService)(...Object.values(deps));
  return { service, deps };
}

beforeEach(() => {
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
});

describe('MemberHomeService', () => {
  it('returns every home section in one answer', async () => {
    const { service, deps } = makeService();
    const home = await service.load(actor);
    expect(home.sermonStreak).toBe(3);
    expect(home.announcements).toEqual([{ id: 'a1' }]);
    expect(home.readingPlan).toEqual({ today: { day: 1 }, subscriptions: [] });
    expect(home.scripture.translations).toEqual([{ code: 'KJV' }]);
    expect(home.latestSermon).toEqual({ ready: false });
    expect(home.pledgeCampaign).toBe(HOME_PLEDGE_CAMPAIGN);
    expect(home.unavailable).toEqual([]);
    expect(home.prayerWatchCurrent).toEqual({ id: 'w1', slots: [] });
    expect(deps.pledges.mine).toHaveBeenCalledWith(actor, HOME_PLEDGE_CAMPAIGN);
    expect(deps.spouse.mine).toHaveBeenCalledWith('u1', 'a@b.org');
  });

  it('leaves a failing section empty instead of failing the page', async () => {
    const { service } = makeService({ scripture: { today: jest.fn().mockRejectedValue(new Error('bible API down')) } });
    const home = await service.load(actor);
    expect(home.scripture.today).toBeNull();
    expect(home.unavailable).toEqual(['scriptureToday']);
    expect(home.announcements).toEqual([{ id: 'a1' }]);
  });

  it('gives someone without a member record an empty evangelism tally and no prayer watch', async () => {
    const { service, deps } = makeService();
    const home = await service.load({ ...actor, memberId: null, profileId: null });
    expect(home.evangelismTally).toMatchObject({ reached: 0, saved: 0 });
    expect(home.prayerWatch).toBeNull();
    expect(deps.evangelism.tally).not.toHaveBeenCalled();
    expect(deps.prayerWatch.getMySignup).not.toHaveBeenCalled();
  });
});
