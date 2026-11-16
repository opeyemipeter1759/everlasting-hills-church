import { AttendanceAlertsService } from './attendance-alerts.service';
import { CURRENT_MEMBERS } from './attendance-analytics.utils';

function setup() {
  const prisma = {
    service: {
      findMany: jest.fn().mockResolvedValue([
        { id: 's1', scheduledAt: new Date('2026-11-01T23:00:00Z'), AttendanceRecord: [{ memberId: 'm1', present: false }] },
        { id: 's2', scheduledAt: new Date('2026-11-07T23:00:00Z'), AttendanceRecord: [{ memberId: 'm1', present: false }] },
        { id: 's3', scheduledAt: new Date('2026-11-14T23:00:00Z'), AttendanceRecord: [{ memberId: 'm1', present: false }] },
      ]),
    },
    member: { findMany: jest.fn().mockResolvedValue([{ id: 'm1', firstName: 'Ada', lastName: 'Eze', photoUrl: null }]) },
  };
  return { prisma, svc: new AttendanceAlertsService(prisma as never, { get: () => 't1' } as never) };
}

describe('AttendanceAlertsService.getAlerts', () => {
  it('reads absences from current members only, so nobody deactivated is named', async () => {
    const { prisma, svc } = setup();

    const alerts = await svc.getAlerts();

    expect(prisma.service.findMany.mock.calls[0][0].select.AttendanceRecord.where).toEqual(CURRENT_MEMBERS);
    expect(CURRENT_MEMBERS).toEqual({ Member: { status: 'ACTIVE' } });
    expect(alerts.find((a) => a.type === 'AT_RISK')?.message).toBe('Ada Eze has been absent 3 times in the last 3 weeks');
  });
});
