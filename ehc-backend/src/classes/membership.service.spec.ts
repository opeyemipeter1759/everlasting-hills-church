import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { MembershipService } from './membership.service';

function actor(roles: Role[]): AuthUser {
  return {
    userId: 'u1',
    email: 'a@x.com',
    role: roles[0] ?? null,
    effectiveRoles: [Role.MEMBER, ...roles],
    unitLeadOf: [],
    hodOf: [],
    headUsher: false,
    profileId: 'p-actor',
    memberId: 'm-actor',
    tenantId: 't1',
  };
}

function setup(approval: unknown = null, member: unknown = null) {
  const prisma = {
    membershipApproval: { findFirst: jest.fn().mockResolvedValue(approval), update: jest.fn().mockReturnValue('approval-update') },
    member: { findFirst: jest.fn().mockResolvedValue(member), update: jest.fn().mockReturnValue('member-update') },
    membershipEvent: { create: jest.fn().mockReturnValue('event-create') },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const inbox = { createMany: jest.fn().mockResolvedValue(undefined) };
  const config = { get: () => 't1' };
  const svc = new MembershipService(prisma as never, inbox as never, config as never);
  return { svc, prisma, inbox };
}

const pending = { id: 'a1', status: 'PENDING', memberId: 'm1', Member: { profileId: 'p1', membershipStatus: 'IN_TRAINING' } };

describe('MembershipService.decide', () => {
  it('only lets a Pastor or Admin decide', async () => {
    const { svc } = setup(pending);
    await expect(svc.decide(actor([]), 'a1', true)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.decide(actor([Role.UNIT_LEAD]), 'a1', true)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('confirming sets FULL and writes an APPROVAL event', async () => {
    const { svc, prisma, inbox } = setup(pending);
    await expect(svc.decide(actor([Role.PASTOR]), 'a1', true)).resolves.toEqual({ id: 'a1', status: 'CONFIRMED' });
    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ membershipStatus: 'FULL' }) }),
    );
    expect(prisma.membershipEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ method: 'APPROVAL', fromStatus: 'IN_TRAINING', toStatus: 'FULL' }) }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(['approval-update', 'member-update', 'event-create']);
    expect(inbox.createMany).toHaveBeenCalled();
  });

  it('declining leaves the member in training', async () => {
    const { svc, prisma } = setup(pending);
    await expect(svc.decide(actor([Role.ADMIN]), 'a1', false, 'Meet with me first')).resolves.toEqual({ id: 'a1', status: 'DECLINED' });
    expect(prisma.member.update).not.toHaveBeenCalled();
    expect(prisma.membershipEvent.create).not.toHaveBeenCalled();
  });

  it('refuses an approval already decided', async () => {
    const { svc } = setup({ ...pending, status: 'CONFIRMED' });
    await expect(svc.decide(actor([Role.PASTOR]), 'a1', true)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MembershipService.setStatus', () => {
  it('needs a reason', async () => {
    const { svc } = setup(null, { id: 'm1', membershipStatus: 'IN_TRAINING' });
    await expect(svc.setStatus(actor([Role.PASTOR]), 'm1', 'FULL', ' ok ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('writes an EXCEPTION event with the reason', async () => {
    const { svc, prisma } = setup(null, { id: 'm1', membershipStatus: 'IN_TRAINING' });
    await expect(svc.setStatus(actor([Role.ADMIN]), 'm1', 'FULL', 'Transferred from a sister church')).resolves.toMatchObject({ changed: true });
    expect(prisma.membershipEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ method: 'EXCEPTION', reason: 'Transferred from a sister church' }) }),
    );
  });

  it('is a no-op when the status is unchanged', async () => {
    const { svc, prisma } = setup(null, { id: 'm1', membershipStatus: 'FULL' });
    await expect(svc.setStatus(actor([Role.ADMIN]), 'm1', 'FULL', 'Already a member')).resolves.toMatchObject({ changed: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses non-staff', async () => {
    const { svc } = setup(null, { id: 'm1', membershipStatus: 'IN_TRAINING' });
    await expect(svc.setStatus(actor([]), 'm1', 'FULL', 'Because I said so')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
