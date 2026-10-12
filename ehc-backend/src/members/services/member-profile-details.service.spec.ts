import { MemberProfileDetailsService, cleanList, visibilityOf } from './member-profile-details.service';

const config = { get: () => 'tenant' } as never;
const stored = {
  memberId: 'ada',
  tenantId: 'tenant',
  headline: 'Civil engineer · Choir member',
  coverUrl: 'https://cdn.test/covers/ada.jpg',
  favouriteVerse: 'The Lord is my shepherd',
  favouriteVerseRef: 'Psalm 23:1',
  bornAgainYear: 2008,
  waterBaptismYear: 2009,
  holySpiritYear: null,
  membershipClassYear: 2015,
  occupation: 'Civil engineer',
  employer: 'Ibadan Works',
  industry: 'Construction',
  skills: ['AutoCAD'],
  gifts: ['Music'],
  interests: ['Football'],
  languages: ['English', 'Yoruba'],
  prayerFocus: 'My new business',
  testimony: 'God healed me',
  openTo: ['PRAYER_PARTNER'],
  visibility: { career: 'PRIVATE', testimony: 'PRIVATE' },
  updatedAt: new Date(),
};

function setup(row: Record<string, unknown> | null = stored) {
  const prisma = {
    memberProfileDetails: {
      findUnique: jest.fn().mockResolvedValue(row),
      upsert: jest.fn(({ create }) => Promise.resolve({ ...create })),
    },
    member: { findUnique: jest.fn().mockResolvedValue({ phone: '0803 000 0000' }) },
  };
  return { svc: new MemberProfileDetailsService(prisma as never, config), prisma };
}

describe('A member’s spiritual and career profile', () => {
  it('shows other members only what the member has opened to them', async () => {
    const { svc, prisma } = setup();
    const seen = await svc.forViewer('ada', false);
    expect(seen.restricted).toBe(false);
    expect(seen.headline).toBe('Civil engineer · Choir member');
    expect(seen.journey).toMatchObject({ bornAgainYear: 2008 });
    expect(seen.career).toBeNull();
    expect(seen.testimony).toBeNull();
    // Contact details stay private unless the member opens them.
    expect(seen.phone).toBeNull();
    expect(prisma.member.findUnique).not.toHaveBeenCalled();
  });

  it('shows the member themselves, and pastors, everything', async () => {
    const { svc } = setup();
    const seen = await svc.forViewer('ada', true);
    expect(seen.career).toMatchObject({ occupation: 'Civil engineer', employer: 'Ibadan Works' });
    expect(seen.testimony).toBe('God healed me');
    expect(seen.phone).toBe('0803 000 0000');
  });

  it('leaves a private profile restricted', async () => {
    const { svc } = setup({ ...stored, visibility: { profile: 'PRIVATE' } });
    expect((await svc.forViewer('ada', false)).restricted).toBe(true);
    expect((await svc.forViewer('ada', true)).restricted).toBe(false);
  });

  it('tidies lists and keeps unknown visibility out', async () => {
    expect(cleanList(['  Music ', 'music', 'Teaching', ''])).toEqual(['Music', 'Teaching']);
    expect(visibilityOf({ career: 'PRIVATE', phone: 'EVERYONE' })).toMatchObject({ career: 'PRIVATE', phone: 'PRIVATE', profile: 'MEMBERS' });

    const { svc, prisma } = setup(null);
    await svc.update('ada', { headline: '  Teacher  ', skills: ['Maths', 'maths'], openTo: ['MENTOR', 'NONSENSE'], visibility: { phone: 'MEMBERS' } });
    const { create } = prisma.memberProfileDetails.upsert.mock.calls[0][0];
    expect(create).toMatchObject({ headline: 'Teacher', skills: ['Maths'], openTo: ['MENTOR'] });
    expect(create.visibility).toMatchObject({ phone: 'MEMBERS', career: 'MEMBERS' });
  });
});
