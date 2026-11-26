import { BadRequestException } from '@nestjs/common';
import { MyFollowUpService, lagosMonthStart } from './my-follow-up.service';

const counts = (o: Record<string, number>) => ({
  FIRST_TIMER: 0, SECOND_TIMER: 0, THIRD_TIMER: 0, FOURTH_TIMER: 0, AWAY: 0, INTEGRATED: 0, OPTED_OUT: 0, ...o,
  all: Object.values(o).reduce((n, v) => n + v, 0),
});

function setup() {
  const pipeline = {
    list: jest.fn(async (f: { notContacted?: boolean }) =>
      f.notContacted ? { counts: counts({ FIRST_TIMER: 2, AWAY: 1 }) } : { counts: counts({ FIRST_TIMER: 3, SECOND_TIMER: 1, INTEGRATED: 4, AWAY: 2 }) },
    ),
  };
  const prisma = {
    followUpContactLog: {
      count: jest.fn(async (q: { where: { outcome?: string } }) => (q.where.outcome ? 2 : 10)),
      groupBy: jest.fn(async () => [{ method: 'CALL', _count: { _all: 3 } }, { method: 'WHATSAPP', _count: { _all: 1 } }]),
    },
    followUpEntry: { count: jest.fn(async () => 1) },
    approvalRequest: { groupBy: jest.fn(async () => [{ status: 'PENDING', _count: { _all: 1 } }, { status: 'APPROVED', _count: { _all: 2 } }]) },
  };
  const config = { get: () => 'tenant' };
  return { service: new MyFollowUpService(prisma as never, pipeline as never, config as never), pipeline, prisma };
}

const actor = { memberId: 'm1', profileId: 'p1' } as never;

describe('A team member’s own follow-up', () => {
  it('starts the month at midnight in Lagos', () => {
    expect(lagosMonthStart(new Date('2026-11-26T12:00:00Z')).toISOString()).toBe('2026-10-31T23:00:00.000Z');
    expect(lagosMonthStart(new Date('2026-11-30T23:30:00Z')).toISOString()).toBe('2026-11-30T23:00:00.000Z');
  });

  it('counts only their own people and their own logs', async () => {
    const { service, pipeline, prisma } = setup();
    const out = await service.activity(actor, new Date('2026-11-26T12:00:00Z'));
    expect(pipeline.list).toHaveBeenCalledWith(expect.objectContaining({ assigneeId: 'm1' }));
    expect(prisma.followUpContactLog.count).toHaveBeenCalledWith({ where: expect.objectContaining({ byId: 'm1' }) });
    expect(out.assigned).toMatchObject({ total: 10, active: 4 });
    expect(out.waitingFirstContact).toBe(2);
    expect(out.contacts).toEqual({ allTime: 10, thisMonth: 4, reachedThisMonth: 2, byMethodThisMonth: { CALL: 3, WHATSAPP: 1 } });
    expect(out.firstContactsThisMonth).toBe(1);
    expect(out.integrationRequests).toEqual({ pending: 1, approved: 2, changesRequested: 0 });
  });

  it('needs a member record', async () => {
    const { service } = setup();
    await expect(service.activity({ memberId: null, profileId: 'p1' } as never)).rejects.toBeInstanceOf(BadRequestException);
  });
});
