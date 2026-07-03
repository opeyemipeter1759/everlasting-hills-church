import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { SermonsService } from './sermons.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Targeted tests for the security-critical and business-logic parts of SermonsService.
 *
 * What we care about most:
 *   - Tenant scope on delete + setFeatured (cross-tenant attack mitigation)
 *   - Streak math (subtle date logic that's easy to break)
 *   - Reaction toggle behavior
 */

function makePrisma(overrides: Partial<Record<string, unknown>> = {}): PrismaService {
  return {
    sermon: {
      delete: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    sermonReaction: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    listenProgress: {
      findMany: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
    },
    ...overrides,
  } as unknown as PrismaService;
}

function makeService(prisma: PrismaService): SermonsService {
  const config = {
    get: jest.fn().mockReturnValue('tenant-test'),
  } as unknown as ConfigService;
  const inbox = { createMany: jest.fn() } as never;
  return new SermonsService(prisma, inbox, config as never);
}

describe('SermonsService', () => {
  describe('deleteSermon', () => {
    it('uses tenant-scoped deleteMany and throws 404 when nothing was deleted', async () => {
      const prisma = makePrisma();
      (prisma.sermon.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      const service = makeService(prisma);

      await expect(service.deleteSermon('foreign-tenant-id')).rejects.toThrow(NotFoundException);
      expect(prisma.sermon.deleteMany).toHaveBeenCalledWith({
        where: { id: 'foreign-tenant-id', tenantId: 'tenant-test' },
      });
    });

    it('returns {deleted: true} when a tenant-owned sermon was deleted', async () => {
      const prisma = makePrisma();
      (prisma.sermon.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      const service = makeService(prisma);

      const result = await service.deleteSermon('our-sermon');
      expect(result).toEqual({ id: 'our-sermon', deleted: true });
    });
  });

  describe('setFeaturedSermon', () => {
    it('verifies tenant ownership BEFORE clearing other featured flags', async () => {
      const prisma = makePrisma();
      (prisma.sermon.findFirst as jest.Mock).mockResolvedValue(null);
      const service = makeService(prisma);

      await expect(service.setFeaturedSermon('foreign-id')).rejects.toThrow(NotFoundException);
      // CRITICAL: updateMany must NOT be called when the target isn't in this tenant.
      // Otherwise a foreign attacker could wipe our featured flag.
      expect(prisma.sermon.updateMany).not.toHaveBeenCalled();
      expect(prisma.sermon.update).not.toHaveBeenCalled();
    });

    it('clears existing featured and sets the new one when tenant-owned', async () => {
      const prisma = makePrisma();
      (prisma.sermon.findFirst as jest.Mock).mockResolvedValue({ id: 'our-sermon' });
      (prisma.sermon.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.sermon.update as jest.Mock).mockResolvedValue({ id: 'our-sermon', isFeatured: true });
      const service = makeService(prisma);

      const result = await service.setFeaturedSermon('our-sermon');

      expect(prisma.sermon.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-test', isFeatured: true },
        data: { isFeatured: false },
      });
      expect(prisma.sermon.update).toHaveBeenCalled();
      expect(result.isFeatured).toBe(true);
    });
  });

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

  describe('upsertReaction', () => {
    it('deletes (toggles off) when reacting with the same type already on record', async () => {
      const prisma = makePrisma();
      (prisma.sermonReaction.findUnique as jest.Mock).mockResolvedValue({ type: 'LIKE' });
      (prisma.sermonReaction.delete as jest.Mock).mockResolvedValue({});
      const service = makeService(prisma);

      const result = await service.upsertReaction('member-1', 'sermon-1', 'LIKE');

      expect(result).toBeNull();
      expect(prisma.sermonReaction.delete).toHaveBeenCalled();
      expect(prisma.sermonReaction.upsert).not.toHaveBeenCalled();
    });

    it('upserts when there is no existing reaction', async () => {
      const prisma = makePrisma();
      (prisma.sermonReaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sermonReaction.upsert as jest.Mock).mockResolvedValue({ type: 'AMEN' });
      const service = makeService(prisma);

      const result = await service.upsertReaction('member-1', 'sermon-1', 'AMEN');

      expect(result).toEqual({ type: 'AMEN' });
      expect(prisma.sermonReaction.delete).not.toHaveBeenCalled();
    });

    it('switches type when reacting differently', async () => {
      const prisma = makePrisma();
      (prisma.sermonReaction.findUnique as jest.Mock).mockResolvedValue({ type: 'LIKE' });
      (prisma.sermonReaction.upsert as jest.Mock).mockResolvedValue({ type: 'AMEN' });
      const service = makeService(prisma);

      const result = await service.upsertReaction('member-1', 'sermon-1', 'AMEN');

      expect(result).toEqual({ type: 'AMEN' });
      expect(prisma.sermonReaction.delete).not.toHaveBeenCalled();
    });
  });
});
