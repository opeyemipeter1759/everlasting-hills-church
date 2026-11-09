import { AttendanceAbsenceService } from './attendance-absence.service';

function makeService(opts: { serviceType?: string; members?: { id: string }[]; presentIds?: string[] }) {
  const prisma = {
    service: { findUnique: jest.fn().mockResolvedValue({ id: 's1', serviceType: opts.serviceType ?? 'SUNDAY' }) },
    member: { findMany: jest.fn().mockResolvedValue(opts.members ?? []) },
    attendanceRecord: {
      findMany: jest.fn().mockResolvedValue((opts.presentIds ?? []).map((memberId) => ({ memberId }))),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };
  const svc = new AttendanceAbsenceService(prisma as never, { get: () => 't1' } as never);
  return { svc, prisma };
}

describe('AttendanceAbsenceService.markMissingAsAbsent', () => {
  it('only marks active members absent, so a deactivated member is left out', async () => {
    const { svc, prisma } = makeService({ members: [{ id: 'm1' }] });
    await svc.markMissingAsAbsent('s1');
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1', status: 'ACTIVE' } }),
    );
  });

  it('marks the active members who did not check in', async () => {
    const { svc, prisma } = makeService({ members: [{ id: 'm1' }, { id: 'm2' }], presentIds: ['m1'] });
    await expect(svc.markMissingAsAbsent('s1')).resolves.toEqual({ marked: 1 });
    expect(prisma.attendanceRecord.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.attendanceRecord.upsert.mock.calls[0][0].where).toEqual({
      memberId_serviceId: { memberId: 'm2', serviceId: 's1' },
    });
  });

  it('writes nothing for a special service', async () => {
    const { svc, prisma } = makeService({ serviceType: 'SPECIAL', members: [{ id: 'm1' }] });
    await expect(svc.markMissingAsAbsent('s1')).resolves.toEqual({ marked: 0 });
    expect(prisma.attendanceRecord.upsert).not.toHaveBeenCalled();
  });
});
