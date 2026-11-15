import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { GiftExchangeService } from './gift-exchange.service';
import { GiftExchangeAdminService } from './gift-exchange-admin.service';

const config = (override?: string) => ({ get: (key: string) => (key === 'GIFT_EXCHANGE_TARGET_DATE' ? override : 'tenant') });
const member = (memberId: string | null = 'm1') =>
  ({ userId: 'auth', email: 'a@b.c', role: Role.MEMBER, effectiveRoles: [Role.MEMBER], unitLeadOf: [], hodOf: [], headUsher: false,
    profileId: 'p1', memberId, tenantId: null }) as never;

function build(entry: { status: string; rejectionReason?: string | null } | null = null, total = 3) {
  const prisma = {
    giftExchangeEntry: {
      findUnique: jest.fn().mockResolvedValue(entry),
      count: jest.fn().mockResolvedValue(total),
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue(entry ? { id: 'e1' } : null),
      update: jest.fn().mockResolvedValue({ id: 'e1' }),
    },
  };
  return { svc: new GiftExchangeService(prisma as never, config() as never), admin: new GiftExchangeAdminService(prisma as never, config() as never), prisma };
}

describe('a member showing interest', () => {
  it('shows the count but no countdown before they are in', async () => {
    const res = await build(null, 7).svc.me(member());
    expect(res).toMatchObject({ registered: false, status: null, totalInterested: 7, targetDate: null });
    expect(typeof res.serverTime).toBe('string');
  });

  it('gives the countdown target once they are in', async () => {
    const res = await build({ status: 'INTERESTED' }).svc.me(member());
    expect(res.targetDate).toMatch(/^\d{4}-12-0\dT00:00:00\.000\+01:00$/);
  });

  it('counts only INTERESTED entries', async () => {
    const { svc, prisma } = build();
    await svc.me(member());
    expect(prisma.giftExchangeEntry.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', status: 'INTERESTED' } });
  });

  it('registers with the signed-in member, and does nothing more if already in', async () => {
    const fresh = build();
    await fresh.svc.register(member('m9'));
    expect(fresh.prisma.giftExchangeEntry.create.mock.calls[0][0].data).toMatchObject({ memberId: 'm9', tenantId: 'tenant' });
    const already = build({ status: 'INTERESTED' });
    await already.svc.register(member());
    expect(already.prisma.giftExchangeEntry.create).not.toHaveBeenCalled();
  });

  it('treats a double tap that hits the unique constraint as already registered', async () => {
    const { svc, prisma } = build();
    prisma.giftExchangeEntry.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }));
    await expect(svc.register(member())).resolves.toMatchObject({ totalInterested: 3 });
  });

  it('refuses a rejected member with 403, and withdrawing leaves the rejection in place', async () => {
    const { svc, prisma } = build({ status: 'REJECTED', rejectionReason: 'Not a member yet' });
    await expect(svc.register(member())).rejects.toBeInstanceOf(ForbiddenException);
    await svc.withdraw(member());
    expect(prisma.giftExchangeEntry.deleteMany).toHaveBeenCalledWith({ where: { memberId: 'm1', status: 'INTERESTED' } });
  });

  it('withdraws without error when not registered, or without a member profile', async () => {
    await expect(build().svc.withdraw(member())).resolves.toMatchObject({ registered: false });
    await expect(build().svc.withdraw(member(null))).resolves.toMatchObject({ registered: false });
  });
});

describe('admins reviewing entries', () => {
  it('rejects with a reason and records who did it', async () => {
    const { admin, prisma } = build({ status: 'INTERESTED' });
    await admin.reject(member(), 'e1', '  Duplicate account ');
    expect(prisma.giftExchangeEntry.update.mock.calls[0][0].data).toMatchObject({ status: 'REJECTED', rejectionReason: 'Duplicate account', reviewedById: 'p1' });
  });

  it('reinstates and clears the reason', async () => {
    const { admin, prisma } = build({ status: 'REJECTED' });
    await admin.reinstate(member(), 'e1');
    expect(prisma.giftExchangeEntry.update.mock.calls[0][0].data).toMatchObject({ status: 'INTERESTED', rejectionReason: null });
  });

  it('returns 404 for an entry that does not exist', async () => {
    await expect(build(null).admin.reject(member(), 'nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(build(null).admin.reinstate(member(), 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
