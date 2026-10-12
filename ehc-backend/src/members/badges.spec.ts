import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { earnedBadges } from './badges';
import { ProfileSocialService } from './services/profile-social.service';

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

describe('Member badges', () => {
  it('awards each tier on the day its threshold was crossed', () => {
    const attendance = Array.from({ length: 12 }, (_, i) => day(12 - i)); // unsorted on purpose
    const { badges, progress } = earnedBadges({ attendance });

    expect(badges.map((b) => [b.id, b.name, b.level, b.earnedAt])).toEqual([
      ['attendance-10', 'Faithful Worshipper', 'silver', day(10)],
      ['attendance-1', 'First Steps In', 'bronze', day(1)],
    ]);
    expect(badges[0].description).toBe('10 services attended');
    expect(progress.find((p) => p.track === 'attendance')).toEqual({
      track: 'attendance',
      count: 12,
      next: { name: 'Planted in the House', at: 25, description: '25 services attended' },
    });
  });

  it('counts every kind of activity the church asked for', () => {
    const one = [day(1)];
    const { badges } = earnedBadges({
      bibleDays: one,
      plansFinished: one,
      reached: one,
      saved: one,
      salvation: one,
      books: one,
      birthdays: one,
      likes: one,
      comments: one,
      articles: one,
      courses: one,
    });
    expect(badges.map((b) => b.name).sort()).toEqual(
      [
        'Opened the Word',
        'Finisher',
        'Sower',
        'First Fruit',
        'New Creation',
        'Reader',
        'Kind Word',
        'Friendly',
        'Voice in the Body',
        'Scribe',
        'Disciple',
      ].sort(),
    );
  });

  it('awards nothing for no activity, and shows the first badge to aim for', () => {
    const { badges, progress } = earnedBadges({});
    expect(badges).toEqual([]);
    expect(progress.find((p) => p.track === 'books')?.next).toMatchObject({ name: 'Reader', at: 1 });
  });
});

describe('Likes and encouragement on profiles', () => {
  function setup() {
    const prisma = {
      member: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ada', profileId: 'p-ada', firstName: 'Ada', lastName: 'Obi' }),
        findUnique: jest.fn().mockResolvedValue({ firstName: 'Bayo', lastName: 'Ade' }),
      },
      profileLike: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(1),
      },
      profileComment: {
        create: jest.fn().mockResolvedValue({ id: 'c1' }),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const inbox = { createMany: jest.fn().mockResolvedValue(1) };
    const svc = new ProfileSocialService(prisma as never, inbox as never, { get: () => 'tenant' } as never);
    return { svc, prisma, inbox };
  }

  it('likes once and tells the owner', async () => {
    const { svc, prisma, inbox } = setup();
    await svc.like('ada', 'bayo');
    expect(prisma.profileLike.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ memberId: 'ada', likerMemberId: 'bayo' }),
    });
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ profileId: 'p-ada', title: 'Bayo Ade liked your profile' })]);

    prisma.profileLike.findUnique.mockResolvedValue({ id: 'l1' });
    await svc.like('ada', 'bayo');
    expect(prisma.profileLike.create).toHaveBeenCalledTimes(1);
  });

  it('does not let a member like or write on their own profile', async () => {
    const { svc } = setup();
    await expect(svc.like('ada', 'ada')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.comment('ada', 'ada', 'Hi')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps a word of encouragement and tells the owner', async () => {
    const { svc, prisma, inbox } = setup();
    await svc.comment('ada', 'bayo', '  God bless you, sister!  ');
    expect(prisma.profileComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ memberId: 'ada', authorMemberId: 'bayo', body: 'God bless you, sister!' }),
      select: { id: true },
    });
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ title: 'Bayo Ade wrote on your profile' })]);
  });

  it('lets the writer, the owner or staff remove a comment, and no one else', async () => {
    const { svc, prisma } = setup();
    prisma.profileComment.findFirst.mockResolvedValue({ id: 'c1', authorMemberId: 'bayo', memberId: 'ada' });
    await expect(svc.deleteComment('ada', 'c1', 'chidi', false)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.deleteComment('ada', 'c1', 'bayo', false)).resolves.toEqual({ ok: true });
    await expect(svc.deleteComment('ada', 'c1', 'ada', false)).resolves.toEqual({ ok: true });
    await expect(svc.deleteComment('ada', 'c1', null, true)).resolves.toEqual({ ok: true });
  });
});
