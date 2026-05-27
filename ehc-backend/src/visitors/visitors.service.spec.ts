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
        expect.objectContaining({ where: { tenantId: 'tenant-test' } }),
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
      expect(count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-test' } });
      expect(n).toBe(42);
    });
  });
});
