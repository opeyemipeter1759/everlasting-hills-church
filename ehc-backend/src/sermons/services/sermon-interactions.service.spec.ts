import { ConfigService } from '@nestjs/config';
import { SermonInteractionsService } from './sermon-interactions.service';
import { SermonMemberLookupService } from './sermon-member-lookup.service';
import type { PrismaService } from '../../prisma/prisma.service';

function makePrisma(overrides: Partial<Record<string, unknown>> = {}): PrismaService {
  return {
    sermonReaction: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    ...overrides,
  } as unknown as PrismaService;
}

function makeService(prisma: PrismaService): SermonInteractionsService {
  const config = { get: jest.fn().mockReturnValue('tenant-test') } as unknown as ConfigService;
  return new SermonInteractionsService(prisma, new SermonMemberLookupService(prisma), config as never);
}

describe('SermonInteractionsService', () => {
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
