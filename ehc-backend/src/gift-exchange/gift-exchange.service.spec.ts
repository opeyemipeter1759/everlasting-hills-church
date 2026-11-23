import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  return { svc: new GiftExchangeService(prisma as never, config() as never), admin: new GiftExchangeAdminService(prisma as never, config() as never), prisma };
}

const both = { giftExchange: true, picnic: true };
const giftOnly = { giftExchange: true, picnic: false };

describe('a member showing interest', () => {
  it('says when it is even before they are in', async () => {
    const res = await build(null, 7).svc.me(member());
    expect(res).toMatchObject({ registered: false, status: null, totalInterested: 7 });
    expect(res.targetDate).toMatch(/^\d{4}-12-0\dT00:00:00\.000\+01:00$/);
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

  it('registers the signed-in member with what they chose', async () => {
    const fresh = build();
    await fresh.svc.register(member('m9'), both);
    expect(fresh.prisma.giftExchangeEntry.create.mock.calls[0][0].data).toMatchObject({ memberId: 'm9', tenantId: 'tenant', giftExchange: true, picnic: true });
  });

  it('changes the choice of someone already in instead of adding a second entry', async () => {
    const already = build({ status: 'INTERESTED' });
    await already.svc.register(member(), { giftExchange: false, picnic: true });
    expect(already.prisma.giftExchangeEntry.create).not.toHaveBeenCalled();
    expect(already.prisma.giftExchangeEntry.update).toHaveBeenCalledWith({ where: { memberId: 'm1' }, data: { giftExchange: false, picnic: true } });
  });

  it('refuses a sign-up with neither the gift exchange nor the picnic', async () => {
    const { svc, prisma } = build();
    await expect(svc.register(member(), { giftExchange: false, picnic: false })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.giftExchangeEntry.create).not.toHaveBeenCalled();
  });

  it('reports the choices back', async () => {
    const res = await build({ status: 'INTERESTED', giftExchange: false, picnic: true } as never).svc.me(member());
    expect(res).toMatchObject({ giftExchange: false, picnic: true });
    expect(await build(null).svc.me(member())).toMatchObject({ giftExchange: false, picnic: false });
  });

  it('treats a double tap that hits the unique constraint as already registered', async () => {
    const { svc, prisma } = build();
    prisma.giftExchangeEntry.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }));
    await expect(svc.register(member(), giftOnly)).resolves.toMatchObject({ totalInterested: 3 });
    expect(prisma.giftExchangeEntry.updateMany).toHaveBeenCalledWith({ where: { memberId: 'm1', status: 'INTERESTED' }, data: giftOnly });
  });

  it('refuses a rejected member with 403, and withdrawing leaves the rejection in place', async () => {
    const { svc, prisma } = build({ status: 'REJECTED', rejectionReason: 'Not a member yet' });
    await expect(svc.register(member(), both)).rejects.toBeInstanceOf(ForbiddenException);
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

  it('filters by activity and counts each activity among people still in', async () => {
    const { admin, prisma } = build();
    const res = await admin.list(undefined, 'PICNIC' as never);
    expect(prisma.giftExchangeEntry.findMany.mock.calls[0][0].where).toEqual({ tenantId: 'tenant', picnic: true });
    expect(prisma.giftExchangeEntry.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', status: 'INTERESTED', giftExchange: true } });
    expect(prisma.giftExchangeEntry.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', status: 'INTERESTED', picnic: true } });
    expect(res.counts).toMatchObject({ giftExchange: 3, picnic: 3 });
  });

  it('returns 404 for an entry that does not exist', async () => {
    await expect(build(null).admin.reject(member(), 'nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(build(null).admin.reinstate(member(), 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
