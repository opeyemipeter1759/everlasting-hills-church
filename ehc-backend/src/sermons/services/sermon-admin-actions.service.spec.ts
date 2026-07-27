import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { SermonAdminActionsService } from './sermon-admin-actions.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Targeted tests for the security-critical parts of SermonAdminActionsService.
 *
 * What we care about most: tenant scope on delete + setFeatured (cross-tenant attack mitigation).
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
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    ...overrides,
  } as unknown as PrismaService;
}

function makeService(prisma: PrismaService): SermonAdminActionsService {
  const config = { get: jest.fn().mockReturnValue('tenant-test') } as unknown as ConfigService;
  return new SermonAdminActionsService(prisma, config as never);
}

describe('SermonAdminActionsService', () => {
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
});
