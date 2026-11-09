import { AttendanceServiceOverviewService } from './attendance-service-overview.service';

const SUNDAY = {
  id: 's2',
  name: 'Sunday Service — Sunday, 8 November 2026',
  serviceType: 'SUNDAY',
  scheduledAt: new Date('2026-11-07T23:00:00Z'),
  ServiceHeadcount: { men: 30, women: 44, boys: 1, girls: 6, firstTimers: 6, total: 81, status: 'CONFIRMED' },
};
const WEDNESDAY = {
  id: 's1',
  name: 'Midweek Service — Wednesday, 4 November 2026',
  serviceType: 'WEDNESDAY',
  scheduledAt: new Date('2026-11-03T23:00:00Z'),
  ServiceHeadcount: null,
};

function makeService(services: unknown[]) {
  const prisma = {
    service: { findMany: jest.fn().mockResolvedValue(services) },
    member: { count: jest.fn().mockResolvedValue(83) },
    attendanceRecord: {
      groupBy: jest.fn().mockResolvedValue([
        { serviceId: 's2', present: true, _count: { _all: 43 } },
        { serviceId: 's2', present: false, _count: { _all: 40 } },
        { serviceId: 's1', present: true, _count: { _all: 12 } },
      ]),
      findMany: jest.fn().mockResolvedValue([
        { serviceId: 's2', Member: { gender: 'Male' } },
        { serviceId: 's2', Member: { gender: 'FEMALE' } },
        { serviceId: 's2', Member: { gender: 'female' } },
        { serviceId: 's2', Member: { gender: null } },
      ]),
    },
  };
  const svc = new AttendanceServiceOverviewService(prisma as never, { get: () => 't1' } as never);
  return { svc, prisma };
}

describe('AttendanceServiceOverviewService.recentServices', () => {
  it('pairs each service with its headcount and the members who checked in', async () => {
    const { svc } = makeService([SUNDAY, WEDNESDAY]);
    const out = await svc.recentServices(12, new Date('2026-11-09T10:00:00Z'));
    expect(out.activeMembers).toBe(83);
    expect(out.services[0]).toEqual({
      id: 's2',
      name: SUNDAY.name,
      serviceType: 'SUNDAY',
      date: '2026-11-08',
      headcount: { men: 30, women: 44, boys: 1, girls: 6, children: 7, firstTimers: 6, total: 81, status: 'CONFIRMED' },
      checkedIn: 43,
      checkedInByGender: { men: 1, women: 2, unknown: 1 },
      absent: 40,
    });
    expect(out.services[1]).toMatchObject({ date: '2026-11-04', headcount: null, checkedIn: 12, absent: 0, checkedInByGender: { men: 0, women: 0, unknown: 0 } });
  });

  it('counts only active members, so a deactivated member is not on the roll', async () => {
    const { svc, prisma } = makeService([SUNDAY]);
    await svc.recentServices();
    expect(prisma.attendanceRecord.groupBy.mock.calls[0][0].where.Member).toEqual({ status: 'ACTIVE' });
    expect(prisma.member.count).toHaveBeenCalledWith({ where: { tenantId: 't1', status: 'ACTIVE' } });
  });

  it('caps how many services it returns and skips the records query when there are none', async () => {
    const { svc, prisma } = makeService([]);
    await expect(svc.recentServices(500)).resolves.toEqual({ activeMembers: 83, services: [] });
    expect(prisma.service.findMany.mock.calls[0][0].take).toBe(52);
    expect(prisma.attendanceRecord.groupBy).not.toHaveBeenCalled();
    expect(prisma.attendanceRecord.findMany).not.toHaveBeenCalled();
  });
});
