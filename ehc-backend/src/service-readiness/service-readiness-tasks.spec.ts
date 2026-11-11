import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ServiceReadinessTasksService } from './service-readiness-tasks.service';

const config = { get: () => 'tenant' };
const leader = { userId: 'auth', email: 'a@b.c', role: Role.MEMBER, effectiveRoles: [Role.MEMBER], unitLeadOf: [], hodOf: [], headUsher: false,
  profileId: 'p-lead', memberId: 'm-lead', tenantId: null } as never;
const admin = { ...(leader as object), profileId: 'p-admin', effectiveRoles: [Role.MEMBER, Role.ADMIN_HEAD] } as never;

function build(opts: { leads?: boolean; task?: { id: string; byAdministrator: boolean } } = {}) {
  const prisma = {
    serviceReadiness: {
      findFirst: jest.fn().mockResolvedValue({ id: 'r1', state: 'NOT_STARTED', Unit: { name: 'Projection' }, Service: { serviceType: 'SUNDAY' } }),
    },
    unitMember: { findMany: jest.fn().mockResolvedValue(opts.leads === false ? [] : [{ unitId: 'u-av' }]) },
    unit: { findMany: jest.fn().mockResolvedValue([]) },
    readinessTask: {
      aggregate: jest.fn().mockResolvedValue({ _max: { position: 1 } }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue(opts.task ?? { id: 't1', byAdministrator: false }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const notify = { tasksAdded: jest.fn().mockResolvedValue(undefined) };
  return { svc: new ServiceReadinessTasksService(prisma as never, notify as never, config as never), prisma, notify };
}

describe("a unit's task list", () => {
  it('adds the leader’s tasks after the existing ones, without emailing anyone', async () => {
    const { svc, prisma, notify } = build();
    await expect(svc.add(leader, 's1', 'u-av', { titles: [' Test the mics ', '', 'Charge batteries'] })).resolves.toEqual({ added: 2 });
    const data = prisma.readinessTask.createMany.mock.calls[0][0].data;
    expect(data.map((t: { title: string; position: number; byAdministrator: boolean }) => [t.title, t.position, t.byAdministrator])).toEqual([
      ['Test the mics', 2, false],
      ['Charge batteries', 3, false],
    ]);
    expect(notify.tasksAdded).not.toHaveBeenCalled();
  });

  it('marks a task the Administrator adds, and emails the unit leaders', async () => {
    const { svc, prisma, notify } = build({ leads: false });
    await svc.add(admin, 's1', 'u-av', { titles: ['Spare HDMI cable on the desk'] });
    expect(prisma.readinessTask.createMany.mock.calls[0][0].data[0]).toMatchObject({ byAdministrator: true, createdById: 'p-admin' });
    expect(notify.tasksAdded).toHaveBeenCalledWith(expect.objectContaining({ unitId: 'u-av', titles: ['Spare HDMI cable on the desk'] }));
  });

  it('ticks a task off and records who did it', async () => {
    const { svc, prisma } = build();
    await svc.update(leader, 's1', 'u-av', 't1', { done: true });
    expect(prisma.readinessTask.update.mock.calls[0][0].data).toMatchObject({ done: true, doneById: 'p-lead' });
  });

  it("won't let a unit leader remove a task the Administrator added", async () => {
    const { svc } = build({ task: { id: 't1', byAdministrator: true } });
    await expect(svc.remove(leader, 's1', 'u-av', 't1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.remove(admin, 's1', 'u-av', 't1')).resolves.toEqual({ deleted: true });
  });

  it('refuses someone who neither leads the unit nor is the Administrator', async () => {
    const { svc } = build({ leads: false });
    await expect(svc.add(leader, 's1', 'u-av', { titles: ['x'] })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
