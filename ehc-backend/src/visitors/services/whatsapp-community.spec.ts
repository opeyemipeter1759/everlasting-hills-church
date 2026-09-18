import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { VisitorsService } from '../visitors.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * The WhatsApp community to-do list: who asked to join and has not been added
 * yet. Marking someone added is the action leaders take on the home page.
 */
function makeService(visitorMock: Record<string, jest.Mock>) {
  const prisma = { visitor: visitorMock } as unknown as PrismaService;
  const config = {
    get: jest.fn().mockReturnValue('tenant-test'),
  } as unknown as ConfigService;
  return new VisitorsService(prisma, config as never);
}

describe('the WhatsApp community list', () => {
  it('lists only this church, only those who asked, and only those still waiting', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = makeService({ findMany });

    await service.whatsappCommunity();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-test',
          whatsappInterest: true,
          whatsappAddedAt: null,
        },
        // Longest wait first: that is the person being let down.
        orderBy: { submittedAt: 'asc' },
      }),
    );
  });

  it('shows the recently added only when asked, newest first', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'waiting-1' }])
      .mockResolvedValueOnce([{ id: 'added-1' }]);
    const service = makeService({ findMany });

    const result = await service.whatsappCommunity({ includeAdded: true });

    expect(result).toEqual({ waiting: [{ id: 'waiting-1' }], added: [{ id: 'added-1' }] });
    expect(findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-test',
          whatsappInterest: true,
          whatsappAddedAt: { not: null },
        },
        orderBy: { whatsappAddedAt: 'desc' },
        take: 20,
      }),
    );
  });

  it('never leaks a phone number beyond the fields the card shows', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = makeService({ findMany });

    await service.whatsappCommunity();

    const { select } = findMany.mock.calls[0][0];
    expect(Object.keys(select).sort()).toEqual(
      ['email', 'firstName', 'id', 'lastName', 'phone', 'submittedAt', 'whatsappAddedAt'].sort(),
    );
  });
});

describe('marking someone added to the community', () => {
  it('records when it happened and who did it, within this church', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = makeService({ updateMany });

    await expect(service.setWhatsappAdded('visitor-1', true, 'profile-9')).resolves.toEqual({
      id: 'visitor-1',
      added: true,
    });
    const { where, data } = updateMany.mock.calls[0][0];
    expect(where).toEqual({ id: 'visitor-1', tenantId: 'tenant-test' });
    expect(data.whatsappAddedAt).toBeInstanceOf(Date);
    expect(data.whatsappAddedBy).toBe('profile-9');
  });

  it('puts someone back on the list when it was marked by mistake', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = makeService({ updateMany });

    await service.setWhatsappAdded('visitor-1', false, 'profile-9');

    expect(updateMany.mock.calls[0][0].data).toEqual({
      whatsappAddedAt: null,
      whatsappAddedBy: null,
    });
  });

  it('says so when that person is not this church’s to mark', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const service = makeService({ updateMany });

    await expect(service.setWhatsappAdded('elsewhere', true, 'profile-9')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
