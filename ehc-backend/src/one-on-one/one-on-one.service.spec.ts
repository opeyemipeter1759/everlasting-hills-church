import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { intersectWindows, OneOnOneService } from './one-on-one.service';

const HOST = { id: 'h1', tenantId: 't1', profileId: 'pastor-faith', displayName: 'Pastor Faith' };

function user(profileId: string, roles: Role[] = [Role.MEMBER]): AuthUser {
  return {
    userId: `u-${profileId}`,
    email: `${profileId}@x.com`,
    role: roles[roles.length - 1],
    effectiveRoles: roles,
    unitLeadOf: [],
    hodOf: [],
    headUsher: false,
    profileId,
    memberId: null,
    tenantId: 't1',
  };
}

function setup() {
  const prisma = {
    pastorHost: {
      findFirst: jest.fn(({ where }): typeof HOST | null => (where.id === 'h1' || where.profileId === 'pastor-faith' ? HOST : null)),
      findFirstOrThrow: jest.fn().mockResolvedValue({ ...HOST, Rules: [], Blocks: [], SessionTypes: [], Delegates: [] }),
      findMany: jest.fn().mockResolvedValue([HOST]),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    },
    pastorDelegate: {
      findFirst: jest.fn(({ where }) => (where.delegateProfileId === 'secretary' ? { id: 'd1' } : null)),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    pastorAvailabilityRule: { deleteMany: jest.fn(), createMany: jest.fn() },
    profile: { findFirst: jest.fn().mockResolvedValue({ id: 'someone' }) },
    $transaction: jest.fn(),
  };
  const cipher = { isConfigured: true };
  const svc = new OneOnOneService(prisma as never, cipher as never, { get: () => 't1' } as never);
  return { svc, prisma };
}

describe('OneOnOneService access', () => {
  it('lets the pastor, their delegate and the Super Admin manage the pastor’s settings', async () => {
    const { svc, prisma } = setup();
    await svc.updateSettings(user('pastor-faith', [Role.MEMBER, Role.PASTOR]), 'h1', { dailyCap: 2 });
    await svc.updateSettings(user('secretary'), 'h1', { dailyCap: 2 });
    await svc.updateSettings(user('pastor-ope', [Role.MEMBER, Role.SUPER_ADMIN]), 'h1', { dailyCap: 2 });
    expect(prisma.pastorHost.update).toHaveBeenCalledTimes(3);
  });

  it('turns everyone else away, including other admins', async () => {
    const { svc } = setup();
    await expect(svc.updateSettings(user('random-member'), 'h1', { dailyCap: 2 })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.updateSettings(user('an-admin', [Role.MEMBER, Role.ADMIN_HEAD]), 'h1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets only the pastor or Super Admin appoint delegates, never a delegate', async () => {
    const { svc, prisma } = setup();
    await expect(svc.addDelegate(user('secretary'), 'h1', { profileId: 'someone' })).rejects.toBeInstanceOf(ForbiddenException);
    await svc.addDelegate(user('pastor-faith', [Role.MEMBER, Role.PASTOR]), 'h1', { profileId: 'someone' });
    await svc.addDelegate(user('pastor-ope', [Role.MEMBER, Role.SUPER_ADMIN]), 'h1', { profileId: 'someone' });
    expect(prisma.pastorDelegate.create).toHaveBeenCalledTimes(2);
  });

  it('refuses to make a pastor their own delegate', async () => {
    const { svc } = setup();
    await expect(svc.addDelegate(user('pastor-faith', [Role.PASTOR]), 'h1', { profileId: 'pastor-faith' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('offers setup to a Pastor or Super Admin without a host row, not to members', async () => {
    const { svc, prisma } = setup();
    prisma.pastorHost.findFirst.mockImplementation(() => null);
    expect((await svc.getManageContext(user('pastor-ope', [Role.MEMBER, Role.SUPER_ADMIN]))).canSetUp).toBe(true);
    expect((await svc.getManageContext(user('a-member'))).canSetUp).toBe(false);
  });
});

describe('OneOnOneService.replaceRules', () => {
  const owner = user('pastor-faith', [Role.PASTOR]);

  it('rejects a range that ends before it starts', async () => {
    const { svc } = setup();
    await expect(svc.replaceRules(owner, 'h1', { rules: [{ weekday: 2, startTime: '16:00', endTime: '10:00' }] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects overlapping ranges on the same day but allows them on different days', async () => {
    const { svc, prisma } = setup();
    await expect(
      svc.replaceRules(owner, 'h1', {
        rules: [
          { weekday: 2, startTime: '10:00', endTime: '13:00' },
          { weekday: 2, startTime: '12:00', endTime: '15:00' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await svc.replaceRules(owner, 'h1', {
      rules: [
        { weekday: 2, startTime: '10:00', endTime: '13:00' },
        { weekday: 4, startTime: '12:00', endTime: '15:00' },
      ],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('intersectWindows', () => {
  it('keeps only the hours both pastors share, per weekday', () => {
    const ope = [
      { weekday: 6, startTime: '09:00', endTime: '13:00' },
      { weekday: 2, startTime: '10:00', endTime: '12:00' },
    ];
    const faith = [
      { weekday: 6, startTime: '10:00', endTime: '14:00' },
      { weekday: 4, startTime: '10:00', endTime: '12:00' },
    ];
    expect(intersectWindows(ope, faith)).toEqual([{ weekday: 6, startTime: '10:00', endTime: '13:00' }]);
  });
});
