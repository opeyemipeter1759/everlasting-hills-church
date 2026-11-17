import { PrismaClient } from '@prisma/client';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { applyFirstVisit, planFirstVisit } from '../../../scripts/followup-v2/backfill-first-visit';
import { applyStatusVisits, daysToAdd, planStatusVisits } from '../../../scripts/followup-v2/backfill-status-visits';
import { applyStudents, planStudents } from '../../../scripts/followup-v2/backfill-students';
import { visitsTestTenant } from './visits-test.helpers';

/**
 * The follow-up v2 data scripts (scripts/followup-v2) against a disposable
 * Postgres: what each one writes, and that a second run writes nothing.
 * Skipped unless PIPELINE_TEST_DATABASE_URL is set; it seeds and deletes its
 * own tenant.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000); // generous: a cold or busy local database can be slow to seed

describe('daysToAdd', () => {
  const row = { firstVisitDate: '2026-02-01', visitDates: ['2026-02-01'], visits: 1 };
  it('uses the approval day, then the day before', () => {
    expect(daysToAdd(row, 3, '2026-03-01', '2026-12-31')).toEqual(['2026-02-28', '2026-03-01']);
  });
  it('skips days they already have and never lands on or before the first visit', () => {
    expect(daysToAdd({ ...row, visitDates: ['2026-02-01', '2026-02-11'], visits: 2 }, 3, '2026-02-11', '2026-12-31')).toEqual(['2026-02-10']);
    expect(daysToAdd(row, 3, '2026-02-01', '2026-12-31')).toEqual(['2026-02-02', '2026-02-03']);
  });
});

maybe('follow-up v2 data scripts against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const t = visitsTestTenant(prisma);
  const pipeline = new PipelineRepository(prisma as never, t.config);
  const formDays = async (visitorId: string) =>
    (await prisma.firstTimerVisit.findMany({ where: { visitorId, source: 'FORM' } })).map((r) => r.visitedOn.toISOString().slice(0, 10));

  beforeAll(() => t.setup());
  afterAll(async () => {
    await t.cleanup();
    await prisma.$disconnect();
  });

  it('backfill-first-visit dates each form from its service, else its submission, and keeps corrections', async () => {
    const serviceId = await t.service('2026-01-03T23:30:00Z'); // 4 January in Lagos
    const late = await t.visitor({ first: 'Typed-late', firstVisit: '2026-01-06', form: false, extra: { serviceId, firstVisitDate: null } });
    const midnight = await t.visitor({ first: 'Midnight', firstVisit: '2026-01-31', form: false, extra: { submittedAt: new Date('2026-01-31T23:30:00Z'), firstVisitDate: null } });
    const corrected = await t.visitor({ first: 'Corrected', firstVisit: '2026-01-10', form: false, extra: { serviceId } });
    const done = await t.visitor({ first: 'Done', firstVisit: '2026-01-11' });

    expect(await planFirstVisit(prisma, t.tenantId)).toEqual({ missingDate: 2, fromService: 1, missingFormVisit: 3 });
    expect(await applyFirstVisit(prisma, t.tenantId)).toEqual({ dates: 2, formVisits: 3 });

    expect((await pipeline.one(late))?.firstVisitDate).toBe('2026-01-04');
    expect((await pipeline.one(midnight))?.firstVisitDate).toBe('2026-02-01');
    expect((await pipeline.one(corrected))?.firstVisitDate).toBe('2026-01-10');
    expect(await formDays(late)).toEqual(['2026-01-04']);
    expect(await formDays(corrected)).toEqual(['2026-01-10']);
    expect(await formDays(done)).toEqual(['2026-01-11']);

    expect(await planFirstVisit(prisma, t.tenantId)).toEqual({ missingDate: 0, fromService: 0, missingFormVisit: 0 });
    expect(await applyFirstVisit(prisma, t.tenantId)).toEqual({ dates: 0, formVisits: 0 });
  });

  it('backfill-status-visits brings approved Second and Third timers up to their visits, once', async () => {
    const second = await t.visitor({ first: 'Second', firstVisit: '2026-02-01' });
    await t.statusChange({ kind: 'VISITOR', subjectId: second, to: 'SECOND_TIMER', requestedAt: '2026-02-10T09:00:00Z', decidedAt: '2026-02-10T23:30:00Z' });
    const third = await t.visitor({ first: 'Third', firstVisit: '2026-02-01' });
    await t.statusChange({ kind: 'VISITOR', subjectId: third, to: 'THIRD_TIMER', requestedAt: '2026-03-01T10:00:00Z', decidedAt: '2026-03-01T10:00:00Z' });
    const movedBack = await t.visitor({ first: 'Moved-back', firstVisit: '2026-02-01' });
    await t.statusChange({ kind: 'VISITOR', subjectId: movedBack, to: 'THIRD_TIMER', requestedAt: '2026-02-08T10:00:00Z' });
    await t.statusChange({ kind: 'VISITOR', subjectId: movedBack, to: 'FIRST_TIMER', requestedAt: '2026-02-15T10:00:00Z' });
    const pending = await t.visitor({ first: 'Pending', firstVisit: '2026-02-01' });
    await t.statusChange({ kind: 'VISITOR', subjectId: pending, to: 'THIRD_TIMER', state: 'PENDING', requestedAt: '2026-02-15T10:00:00Z' });
    const memberId = await t.member('Member-second');
    const converted = await t.visitor({ first: 'Member-second', firstVisit: '2026-02-01', extra: { convertedAt: new Date(), convertedToMemberId: memberId } });
    await t.statusChange({ kind: 'MEMBER', subjectId: memberId, to: 'SECOND_TIMER', requestedAt: '2026-02-22T10:00:00Z' });
    const already = await t.visitor({ first: 'Already', firstVisit: '2026-02-01' });
    for (const d of ['2026-02-08', '2026-02-15']) await t.visit(already, d);
    await t.statusChange({ kind: 'VISITOR', subjectId: already, to: 'THIRD_TIMER', requestedAt: '2026-02-15T10:00:00Z' });

    const plan = await planStatusVisits(prisma, t.tenantId, new Date('2026-11-17T12:00:00Z'));
    expect(Object.fromEntries(plan.map((p) => [p.name, p.add]))).toEqual({
      'Second Test': ['2026-02-11'],
      'Third Test': ['2026-02-28', '2026-03-01'],
      'Member-second Test': ['2026-02-22'],
    });
    expect(await applyStatusVisits(prisma, t.tenantId, plan)).toBe(4);

    expect((await pipeline.one(second))?.status).toBe('SECOND_TIMER');
    expect((await pipeline.one(third))?.status).toBe('THIRD_TIMER');
    expect((await pipeline.one(converted))?.status).toBe('SECOND_TIMER');
    expect((await pipeline.one(movedBack))?.status).toBe('FIRST_TIMER');
    expect((await pipeline.one(pending))?.status).toBe('FIRST_TIMER');
    expect(await prisma.firstTimerVisit.count({ where: { visitorId: third, source: 'BACKFILL_STATUS' } })).toBe(2);

    expect(await planStatusVisits(prisma, t.tenantId, new Date('2026-11-17T12:00:00Z'))).toEqual([]);
  });

  it('backfill-students marks occupations containing "student" and keeps an explicit answer', async () => {
    const make = (occupation: string, isStudent: boolean | null = null) =>
      t.visitor({ first: `Occ-${occupation}`, firstVisit: '2026-03-01', extra: { occupation, isStudent } });
    const marked = await Promise.all([make('Student'), make('University student'), make('STUDENT nurse')]);
    const teacher = await make('Teacher');
    const saidNo = await make('Student', false);

    expect((await planStudents(prisma, t.tenantId)).reduce((n, r) => n + r.n, 0)).toBe(3);
    expect(await applyStudents(prisma, t.tenantId)).toBe(3);
    const rows = await prisma.visitor.findMany({ where: { id: { in: [...marked, teacher, saidNo] } }, select: { id: true, isStudent: true } });
    const isStudent = new Map(rows.map((r) => [r.id, r.isStudent]));
    expect(marked.map((id) => isStudent.get(id))).toEqual([true, true, true]);
    expect(isStudent.get(teacher)).toBeNull();
    expect(isStudent.get(saidNo)).toBe(false);

    expect(await planStudents(prisma, t.tenantId)).toEqual([]);
    expect(await applyStudents(prisma, t.tenantId)).toBe(0);
  });
});
