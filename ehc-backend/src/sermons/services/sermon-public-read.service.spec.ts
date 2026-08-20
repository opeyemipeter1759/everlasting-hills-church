import { NotFoundException } from '@nestjs/common';
import { SermonStatus } from '@prisma/client';
import { SermonEpisodeService } from './sermon-episode.service';
import { SermonPublicReadService } from './sermon-public-read.service';

const config = { get: jest.fn().mockReturnValue('tenant-1') };

describe('public sermon publication boundary', () => {
  it('requires PUBLISHED status when resolving a public sermon slug', async () => {
    const prisma = { sermon: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new SermonPublicReadService(prisma as never, config as never);

    await expect(service.getSermonBySlug('guessed-draft')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.sermon.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'guessed-draft',
          tenantId: 'tenant-1',
          status: SermonStatus.PUBLISHED,
        },
      }),
    );
  });

  it('requires the parent sermon to be PUBLISHED for a public episode lookup', async () => {
    const prisma = { sermon: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new SermonEpisodeService(prisma as never, config as never);

    await expect(service.getEpisodeBySlug('guessed-draft', 'episode-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.sermon.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'guessed-draft',
          tenantId: 'tenant-1',
          status: SermonStatus.PUBLISHED,
        },
      }),
    );
  });
});
