import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PipelineRepository } from './pipeline.repository';
import { PIPELINE_STATUSES } from './pipeline.types';

/**
 * Runs the real pipeline SQL against a disposable Postgres that has the
 * migrations applied. Set PIPELINE_TEST_DATABASE_URL to run it; it is skipped
 * otherwise (CI has no database). Never point it at a real database: it seeds
 * a tenant of its own and deletes it afterwards.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;

maybe('PipelineRepository against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const repo = () => new PipelineRepository(prisma as never, { get: () => tenantId } as never);
  const id = () => randomUUID();

  async function visitor(o: { first: string; firstVisit: string; submittedAt?: string; extra?: Record<string, unknown> }) {
    const v = await prisma.visitor.create({
      data: {
        id: id(), tenantId, firstName: o.first, lastName: 'Test',
        phone: `080${Math.floor(Math.random() * 1e8)}`,
        submittedAt: new Date(o.submittedAt ?? `${o.firstVisit}T09:00:00Z`),
        firstVisitDate: new Date(`${o.firstVisit}T00:00:00Z`),
        ...(o.extra ?? {}),
      },
    });
    return v.id;
  }
  async function visit(visitorId: string, on: string) {
    await prisma.firstTimerVisit.create({ data: { id: id(), tenantId, visitorId, visitedOn: new Date(`${on}T00:00:00Z`), source: 'CAME_AGAIN' } });
  }

  let unitId: string;
  let profileId: string;

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Pipeline test', slug: `pipeline-${tenantId}` } });
    profileId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
    unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow-Up' } })).id;

    // January: one of each status, plus an archived form that must never count.
    await visitor({ first: 'Jan-one', firstVisit: '2026-01-04' });
    const two = await visitor({ first: 'Jan-two', firstVisit: '2026-01-04' });
    await visit(two, '2026-01-11');
    const four = await visitor({ first: 'Jan-four', firstVisit: '2026-01-11' });
    for (const d of ['2026-01-18', '2026-01-25', '2026-02-01']) await visit(four, d);
    const integrated = await visitor({ first: 'Jan-integrated', firstVisit: '2026-01-18' });
    const optedOut = await visitor({ first: 'Jan-out', firstVisit: '2026-01-25' });
    await visit(optedOut, '2026-02-01');
    await visit(optedOut, '2026-02-08');
    for (const [v, stage] of [[integrated, 'CONFIRMED'], [optedOut, 'OPTED_OUT']] as const) {
      await prisma.followUpEntry.create({
        data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId: v, addedById: profileId, stage },
      });
    }
    await visitor({ first: 'Jan-archived', firstVisit: '2026-01-04', extra: { archivedAt: new Date() } });

    // 00:30 Lagos on 1 February is 23:30 UTC on 31 January: February.
    await visitor({ first: 'Feb-midnight', firstVisit: '2026-02-01', submittedAt: '2026-01-31T23:30:00Z', extra: { firstVisitDate: null } });

    // A member made from a form, deactivated: opted out whatever their visits.
    const memberProfile = await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } });
    const member = await prisma.member.create({
      data: { id: id(), tenantId, profileId: memberProfile.id, firstName: 'Mar-member', lastName: 'Test', status: 'INACTIVE' },
    });
    await visitor({ first: 'Mar-member', firstVisit: '2026-03-01', extra: { convertedAt: new Date(), convertedToMemberId: member.id } });
  });

  afterAll(async () => {
    await prisma.followUpEntry.deleteMany({ where: { tenantId } });
    await prisma.firstTimerVisit.deleteMany({ where: { tenantId } });
    await prisma.visitor.deleteMany({ where: { tenantId } });
    await prisma.member.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.unit.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('works out each status, opted out beating integrated beating visits', async () => {
    const { rows } = await repo().list({ year: 2026, month: 1, sort: 'name', take: 50 });
    const status = Object.fromEntries(rows.map((r) => [r.firstName, r.status]));
    expect(status).toEqual({
      'Jan-four': 'THIRD_TIMER',
      'Jan-integrated': 'INTEGRATED',
      'Jan-one': 'FIRST_TIMER',
      'Jan-out': 'OPTED_OUT',
      'Jan-two': 'SECOND_TIMER',
    });
    expect(rows.find((r) => r.firstName === 'Jan-four')?.visits).toBe(4);
  });

  it('makes every total equal the list and the sum of its counts', async () => {
    const page = await repo().list({ year: 2026, take: 200 });
    const sum = PIPELINE_STATUSES.reduce((n, s) => n + page.counts[s], 0);
    expect(page.total).toBe(page.rows.length);
    expect(page.counts.all).toBe(sum);
    expect(page.total).toBe(sum);

    const filtered = await repo().list({ year: 2026, status: 'FIRST_TIMER', take: 200 });
    expect(filtered.total).toBe(filtered.rows.length);
    expect(filtered.total).toBe(filtered.counts.FIRST_TIMER);
  });

  it('adds up every month card, and the year strip to the sum of the months', async () => {
    const year = await repo().year(2026, new Date('2026-12-31T00:00:00Z'));
    expect(year.months).toHaveLength(12);
    for (const m of year.months) {
      expect(PIPELINE_STATUSES.reduce((n, s) => n + m.counts[s], 0)).toBe(m.total);
    }
    expect(year.total.total).toBe(year.months.reduce((n, m) => n + m.total, 0));
    expect(year.months[0].total).toBe(5);
    expect(year.months[1].total).toBe(1);
    expect(year.months[2].counts.OPTED_OUT).toBe(1);
    expect(year.months.slice(3).every((m) => m.total === 0)).toBe(true);

    const january = await repo().list({ year: 2026, month: 1, take: 200 });
    expect(january.total).toBe(year.months[0].total);
  });

  it('shows months before any contact was logged as not tracked', async () => {
    const year = await repo().year(2026, new Date('2026-12-31T00:00:00Z'));
    expect(year.months.every((m) => !m.tracked)).toBe(true);
  });
});
