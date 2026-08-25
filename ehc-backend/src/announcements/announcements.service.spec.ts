import { NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

/**
 * Covers the publish/unpublish pair.
 *
 * Unpublish is what an admin reaches for once an event has passed: the
 * announcement has to leave the member feed (which filters on PUBLISHED)
 * without the record of it, or the recipient count, being destroyed.
 */
function makeService(announcement: Record<string, unknown> | null) {
  const update = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    ...announcement,
    ...data,
  }));
  const prisma = {
    announcement: {
      findFirst: jest.fn().mockResolvedValue(announcement),
      update,
    },
  };
  const service = new AnnouncementsService(
    prisma as never,
    { createMany: jest.fn() } as never,
    { dispatch: jest.fn() } as never,
    { emit: jest.fn() } as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, update, prisma };
}

const published = {
  id: 'a-1',
  tenantId: 'tenant-1',
  title: 'At His Feet',
  body: 'An evening of worship.',
  status: 'PUBLISHED',
  recipients: 42,
  audience: 'all',
};

describe('AnnouncementsService.unpublish', () => {
  it('flips a published announcement back to DRAFT so the feed stops serving it', async () => {
    const { service, update } = makeService(published);

    const result = await service.unpublish('a-1');

    expect(update).toHaveBeenCalledWith({ where: { id: 'a-1' }, data: { status: 'DRAFT' } });
    expect(result.status).toBe('DRAFT');
  });

  it('leaves the recipient count alone — it is the record of what was sent', async () => {
    const { service, update } = makeService(published);

    const result = await service.unpublish('a-1');

    expect(update.mock.calls[0][0].data).not.toHaveProperty('recipients');
    expect(result.recipients).toBe(42);
  });

  it('is a no-op on something already in DRAFT', async () => {
    const { service, update } = makeService({ ...published, status: 'DRAFT' });

    await service.unpublish('a-1');

    expect(update).not.toHaveBeenCalled();
  });

  it('refuses an id from another tenant', async () => {
    const { service } = makeService(null);

    await expect(service.unpublish('a-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
