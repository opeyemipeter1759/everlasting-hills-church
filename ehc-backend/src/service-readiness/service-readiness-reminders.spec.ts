import { ServiceReadinessRemindersService } from './service-readiness-reminders.service';
import { ServiceReadinessViewsService } from './service-readiness-views.service';

const config = { get: () => 'tenant' };
// Sunday 15 Nov 2026: plan due Sat 06:45Z, ready by Sun 06:45Z.
const service = { id: 's1', name: 'Sunday Service', serviceType: 'SUNDAY', scheduledAt: new Date('2026-11-14T23:00:00Z'),
  planDue: new Date('2026-11-14T06:45:00Z'), readyBy: new Date('2026-11-15T06:45:00Z'), inspections: null };
const pending = { id: 'r1', unitId: 'u-av', Unit: { name: 'Projection' } };

describe('reminders and escalation', () => {
  function build(rows: unknown[]) {
    const prisma = {
      serviceReadiness: { findMany: jest.fn().mockResolvedValue(rows), updateMany: jest.fn().mockResolvedValue({}) },
      roleGrant: { findMany: jest.fn().mockResolvedValue([{ userId: 'p-admin' }]) },
    };
    const push = { dispatch: jest.fn().mockResolvedValue({}) };
    const notify = { remindLeaders: jest.fn().mockResolvedValue(undefined) };
    const plans = { upcoming: jest.fn().mockResolvedValue([service]) };
    const svc = new ServiceReadinessRemindersService(prisma as never, plans as never, push as never, notify as never, config as never);
    return { svc, push, notify };
  }

  it('emails and pushes the leaders of units without a plan in the 12 hours before it is due', async () => {
    const { svc, notify } = build([pending]);
    await expect(svc.run(new Date('2026-11-13T20:00:00Z'))).resolves.toEqual({ reminded: 1, escalated: 0 });
    expect(notify.remindLeaders).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }), [{ unitId: 'u-av', unitName: 'Projection' }]);
  });

  it('tells the Administrator which units are still missing 4 hours after the deadline', async () => {
    const { svc, push } = build([pending]);
    await expect(svc.run(new Date('2026-11-14T11:00:00Z'))).resolves.toEqual({ reminded: 0, escalated: 1 });
    expect(push.dispatch.mock.calls[0][1]).toEqual({ tenantId: 'tenant', userIds: ['p-admin'] });
    expect(push.dispatch.mock.calls[0][2]).toMatchObject({ body: 'Projection', url: '/dashboard/admin/service-readiness' });
  });

  it('does nothing early in the week, or once the service is due to be ready', async () => {
    await expect(build([pending]).svc.run(new Date('2026-11-12T09:00:00Z'))).resolves.toEqual({ reminded: 0, escalated: 0 });
    await expect(build([pending]).svc.run(new Date('2026-11-15T07:00:00Z'))).resolves.toEqual({ reminded: 0, escalated: 0 });
  });
});

describe('the readiness board', () => {
  it('lists overdue, then not submitted, blocked, waiting for approval, approved', async () => {
    const row = (unit: string, state: string, extra: Record<string, unknown> = {}) => ({
      state, unitId: unit, confirmedById: null, approvedById: null, approvedAt: null, status: null, Updates: [],
      Unit: { name: unit, Department: null }, Inspections: [], ...extra,
    });
    const prisma = {
      serviceReadiness: {
        findMany: jest.fn().mockResolvedValue([
          row('Worship', 'CONFIRMED', { approvedAt: new Date() }),
          row('Media', 'CONFIRMED'),
          row('Ushering', 'CONFIRMED', { status: 'BLOCKED' }),
          row('Sanitation', 'NOT_STARTED'),
        ]),
      },
      member: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const views = new ServiceReadinessViewsService(prisma as never, { upcoming: jest.fn().mockResolvedValue([service]) } as never, config as never);

    const before = await views.board(undefined, new Date('2026-11-13T08:00:00Z'));
    expect(before.rows.map((r) => r.unitName)).toEqual(['Sanitation', 'Ushering', 'Media', 'Worship']);
    const after = await views.board(undefined, new Date('2026-11-14T08:00:00Z'));
    expect(after.rows[0]).toMatchObject({ unitName: 'Sanitation', overdue: true });
  });
});
