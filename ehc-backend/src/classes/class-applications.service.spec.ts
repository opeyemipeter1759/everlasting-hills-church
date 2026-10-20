import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { ClassApplicationsService } from './class-applications.service';

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

const application = { id: 'e1', status: 'PENDING', Course: { title: 'Membership Class', slug: 'membership' }, Member: { profileId: 'p1' } };

function setup(found: unknown = application, admitted = true) {
  const prisma = {
    courseEnrollment: { findFirst: jest.fn().mockResolvedValue(found), update: jest.fn().mockResolvedValue({}) },
  };
  const inbox = { createMany: jest.fn().mockResolvedValue(undefined) };
  const learner = { admit: jest.fn().mockResolvedValue(admitted) };
  const svc = new ClassApplicationsService(prisma as never, inbox as never, learner as never, { get: () => 't1' } as never);
  return { svc, prisma, inbox, learner };
}

describe('ClassApplicationsService.decide', () => {
  it('lets only a Super Admin, Pastor or Admin Head decide', async () => {
    const { svc } = setup();
    for (const roles of [[], [Role.UNIT_LEAD], [Role.HOD], [Role.HEAD_USHER]]) {
      await expect(svc.decide(actor(roles), 'e1', true)).rejects.toBeInstanceOf(ForbiddenException);
    }
    for (const role of [Role.SUPER_ADMIN, Role.PASTOR, Role.ADMIN_HEAD]) {
      await expect(setup().svc.decide(actor([role]), 'e1', true)).resolves.toMatchObject({ id: 'e1' });
    }
  });

  it('approving admits the member now when they are already eligible', async () => {
    const { svc, prisma, learner, inbox } = setup(application, true);
    await expect(svc.decide(actor([Role.PASTOR]), 'e1', true, 'Welcome')).resolves.toEqual({ id: 'e1', status: 'ACTIVE' });
    expect(prisma.courseEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'WAITING', decidedById: 'p-actor', decisionNote: 'Welcome' }) }),
    );
    expect(learner.admit).toHaveBeenCalledWith('e1');
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ profileId: 'p1', title: 'You are approved for Membership Class' })]);
  });

  it('approving holds the member until they are eligible when they are not yet', async () => {
    const { svc } = setup(application, false);
    await expect(svc.decide(actor([Role.SUPER_ADMIN]), 'e1', true)).resolves.toEqual({ id: 'e1', status: 'WAITING' });
  });

  it('declining records why and does not admit', async () => {
    const { svc, prisma, learner, inbox } = setup();
    await expect(svc.decide(actor([Role.ADMIN_HEAD]), 'e1', false, 'Please attend four Sundays first')).resolves.toEqual({
      id: 'e1',
      status: 'DECLINED',
    });
    expect(prisma.courseEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DECLINED', decisionNote: 'Please attend four Sundays first' }) }),
    );
    expect(learner.admit).not.toHaveBeenCalled();
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ body: 'Please attend four Sundays first' })]);
  });

  it('does not decide an application twice', async () => {
    const { svc, prisma } = setup({ ...application, status: 'ACTIVE' });
    await expect(svc.decide(actor([Role.PASTOR]), 'e1', true)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.courseEnrollment.update).not.toHaveBeenCalled();
  });
});
