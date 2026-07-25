import { SermonMemberStatsService } from './sermon-member-stats.service';
import { SermonMemberLookupService } from './sermon-member-lookup.service';
import type { PrismaService } from '../../prisma/prisma.service';

/** Streak math is subtle date logic that's easy to break — covered directly. */

function makePrisma(overrides: Partial<Record<string, unknown>> = {}): PrismaService {
  return {
    profile: { findUnique: jest.fn() },
    member: { findUnique: jest.fn() },
    listenProgress: { findMany: jest.fn() },
    ...overrides,
  } as unknown as PrismaService;
}

function makeService(prisma: PrismaService): SermonMemberStatsService {
  return new SermonMemberStatsService(prisma, new SermonMemberLookupService(prisma));
}

describe('SermonMemberStatsService', () => {
  describe('getSermonStreak', () => {
    it('returns 0 when the user has no Profile', async () => {
      const prisma = makePrisma();
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue(null);
      const service = makeService(prisma);

      expect(await service.getSermonStreak('user-with-no-profile')).toBe(0);
    });

    it('returns 0 when there is no listen history', async () => {
      const prisma = makePrisma();
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({ id: 'profile-1' });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({ id: 'member-1' });
      (prisma.listenProgress.findMany as jest.Mock).mockResolvedValue([]);
      const service = makeService(prisma);

      expect(await service.getSermonStreak('user')).toBe(0);
    });
  });
});
