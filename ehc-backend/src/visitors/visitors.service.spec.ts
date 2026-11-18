import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import type { PrismaService } from '../prisma/prisma.service';

function makeService(visitorMock: Record<string, jest.Mock>) {
  const prisma = { visitor: visitorMock } as unknown as PrismaService;
  const config = { get: jest.fn().mockReturnValue('tenant-test') } as unknown as ConfigService;
  return new VisitorsService(prisma, config as never, { remove: jest.fn() } as never);
}

describe('VisitorsService', () => {
  describe('list', () => {
    it('always filters by tenantId', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = makeService({ findMany });
      await service.list();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-test' }),
        }),
      );
    });

    it('applies a default limit of 50', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = makeService({ findMany });
      await service.list();
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
    });

    it('respects custom limit', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = makeService({ findMany });
      await service.list({ limit: 5 });
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    });

    it('builds case-insensitive OR clause for search across firstName/lastName/email/phone', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = makeService({ findMany });
      await service.list({ search: 'jane' });
      const call = findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe('tenant-test');
      expect(call.where.OR).toEqual([
        { firstName: { contains: 'jane', mode: 'insensitive' } },
        { lastName: { contains: 'jane', mode: 'insensitive' } },
        { email: { contains: 'jane', mode: 'insensitive' } },
        { phone: { contains: 'jane', mode: 'insensitive' } },
      ]);
    });
  });

  describe('prayerPoints', () => {
    it('lists the prayer requests first-timers wrote, newest first, leaving out archived and empty ones', async () => {
      const findMany = jest.fn().mockResolvedValue([
        { id: 'v1', firstName: 'Ada', lastName: 'Eze', phone: '2348031234567', submittedAt: new Date('2026-11-15T09:00:00Z'), firstVisitDate: new Date('2026-11-15T00:00:00Z'), prayerPoint: ' For my exams ' },
        { id: 'v2', firstName: 'Bola', lastName: 'Ade', phone: null, submittedAt: new Date('2026-11-01T09:00:00Z'), firstVisitDate: null, prayerPoint: '   ' },
      ]);
      const service = makeService({ findMany });
      const rows = await service.prayerPoints();

      expect(findMany.mock.calls[0][0]).toMatchObject({
        where: { tenantId: 'tenant-test', archivedAt: null, prayerPoint: { not: null } },
        orderBy: { submittedAt: 'desc' },
      });
      expect(rows).toEqual([
        { visitorId: 'v1', name: 'Ada Eze', phone: '2348031234567', submittedAt: '2026-11-15T09:00:00.000Z', firstVisitDate: '2026-11-15', prayerPoint: 'For my exams' },
      ]);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the visitor is in a different tenant', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const service = makeService({ findFirst });
      await expect(service.getById('foreign-id')).rejects.toThrow(NotFoundException);
      // Must scope by tenant — verify
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'foreign-id', tenantId: 'tenant-test' },
      });
    });

    it('returns the visitor when found in tenant', async () => {
      const findFirst = jest.fn().mockResolvedValue({ id: 'v1', firstName: 'Jane' });
      const service = makeService({ findFirst });
      const result = await service.getById('v1');
      expect(result.firstName).toBe('Jane');
    });
  });

  describe('count', () => {
    it('counts only visitors in the current tenant', async () => {
      const count = jest.fn().mockResolvedValue(42);
      const service = makeService({ count });
      const n = await service.count();
      expect(count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-test', archivedAt: null } });
      expect(n).toBe(42);
    });
  });

  describe('list', () => {
    it('never lists an archived first-timer', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      await makeService({ findMany }).list();
      expect(findMany.mock.calls[0][0].where).toMatchObject({ convertedAt: null, archivedAt: null });
    });
  });

  describe('update', () => {
    it('stores the phone as 234XXXXXXXXXX however it was typed, and checks clashes on that form', async () => {
      const findFirst = jest.fn().mockResolvedValueOnce({ id: 'v1' }).mockResolvedValueOnce(null);
      const update = jest.fn().mockResolvedValue({ id: 'v1' });
      await makeService({ findFirst, update }).update('v1', { phone: '0803 123 4567', firstName: 'Ada' });
      expect(findFirst.mock.calls[1][0].where.phone).toBe('2348031234567');
      expect(update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { phone: '2348031234567', firstName: 'Ada' } });
    });

    it('leaves the phone alone when the edit does not touch it', async () => {
      const findFirst = jest.fn().mockResolvedValue({ id: 'v1' });
      const update = jest.fn().mockResolvedValue({ id: 'v1' });
      await makeService({ findFirst, update }).update('v1', { firstName: 'Ada' });
      expect(update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { firstName: 'Ada' } });
    });
  });

  describe('delete', () => {
    function deleting(found: unknown) {
      const prisma = { $transaction: jest.fn().mockResolvedValue(found) };
      const photos = { remove: jest.fn() };
      const config = { get: jest.fn().mockReturnValue('tenant-test') } as unknown as ConfigService;
      return { service: new VisitorsService(prisma as never, config as never, photos as never), prisma, photos };
    }

    it('deletes in one transaction, then removes their photo from storage', async () => {
      const removed = { followUpRecords: 1, notes: 2, visits: 1, messages: 0, formSubmissions: 1 };
      const { service, prisma, photos } = deleting({ id: 'v1', name: 'Ada Obi', photoKey: 't/first-timers/v1/a.webp', removed });
      await expect(service.delete('v1', { userId: 'u1', profileId: 'p1' })).resolves.toEqual({ id: 'v1', deleted: true, name: 'Ada Obi', removed });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(photos.remove).toHaveBeenCalledWith(['t/first-timers/v1/a.webp']);
    });

    it('404s for someone not on record', async () => {
      const { service, photos } = deleting(null);
      await expect(service.delete('v1', { userId: 'u1', profileId: 'p1' })).rejects.toThrow(NotFoundException);
      expect(photos.remove).not.toHaveBeenCalled();
    });
  });
});
