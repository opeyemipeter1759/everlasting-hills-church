import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import type { PrismaService } from '../prisma/prisma.service';

function makeService(visitorMock: Record<string, jest.Mock>) {
  const prisma = { visitor: visitorMock } as unknown as PrismaService;
  const config = { get: jest.fn().mockReturnValue('tenant-test') } as unknown as ConfigService;
  return new VisitorsService(prisma, config as never);
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

  describe('archive', () => {
    function archiving(found: unknown) {
      const prisma = {
        visitor: { findFirst: jest.fn().mockResolvedValue(found), update: jest.fn().mockReturnValue('archive') },
        auditLog: { create: jest.fn().mockReturnValue('audit') },
        approvalRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        followUpNote: { deleteMany: jest.fn() },
        $transaction: jest.fn(),
      };
      // The archive runs as one interactive transaction on the same client.
      prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma));
      const config = { get: jest.fn().mockReturnValue('tenant-test') } as unknown as ConfigService;
      return { service: new VisitorsService(prisma as never, config as never), prisma };
    }

    it('archives instead of deleting, keeps the Follow Up conversation, cancels a pending approval and writes an audit row', async () => {
      const { service, prisma } = archiving({ id: 'v1', firstName: 'Ada', lastName: 'Obi', phone: null, email: null });
      const result = await service.archive('v1', { userId: 'u1', profileId: 'p1' });

      expect(result).toMatchObject({ id: 'v1', archived: true });
      expect(prisma.visitor.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { archivedAt: expect.any(Date), archivedById: 'p1' } });
      expect(prisma.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: 'ARCHIVE', entity: 'Visitor', entityId: 'v1', actorId: 'u1' });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.approvalRequest.updateMany.mock.calls[0][0]).toMatchObject({
        where: { tenantId: 'tenant-test', subjectType: 'VISITOR', subjectId: 'v1', status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
      expect(prisma.followUpNote.deleteMany).not.toHaveBeenCalled();
    });

    it('404s for someone not on record, or already archived', async () => {
      const { service, prisma } = archiving(null);
      await expect(service.archive('v1', { userId: 'u1', profileId: 'p1' })).rejects.toThrow(NotFoundException);
      expect(prisma.visitor.findFirst.mock.calls[0][0].where).toEqual({ id: 'v1', tenantId: 'tenant-test', archivedAt: null });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
