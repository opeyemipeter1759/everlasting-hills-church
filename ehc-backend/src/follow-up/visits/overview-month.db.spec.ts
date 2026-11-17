import { Test } from '@nestjs/testing';
import { PrismaClient, Role } from '@prisma/client';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { PIPELINE_STATUSES, type PipelineRow } from '../../pipeline/pipeline.types';
import { PrismaService } from '../../prisma/prisma.service';
import { FollowUpPipelineController } from '../follow-up-pipeline.controller';
import { PhotoUrlService } from '../photos/photo-url.service';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { FirstTimerVisitsService } from './first-timer-visits.service';
import { visitsTestTenant } from './visits-test.helpers';

/**
 * The Overview against a disposable Postgres: every card adds up, the year
 * strip is the sum of its months, a month page lists exactly its card, and
 * nothing pastoral reaches the month page. Skipped unless
 * PIPELINE_TEST_DATABASE_URL is set; it seeds and deletes its own tenant.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000); // generous: a cold or busy local database can be slow to seed

const SECRETS = { prayerPoint: 'PASTORAL-PRAYER-7f3', serviceExperience: 'PASTORAL-EXPERIENCE-7f3', bornAgain: 'PASTORAL-FAITH-7f3' };

maybe('Overview month and year against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const t = visitsTestTenant(prisma);
  const pipeline = new PipelineRepository(prisma as never, t.config);
  const visits = new FirstTimerVisitsService(prisma as never, pipeline, t.config);
  let controller: FollowUpPipelineController;
  let pastoralId: string;

  beforeAll(async () => {
    await t.setup();
    const moduleRef = await Test.createTestingModule({
      controllers: [FollowUpPipelineController],
      providers: [
        { provide: PipelineRepository, useValue: pipeline },
        { provide: PrismaService, useValue: prisma },
        { provide: FollowUpAuthService, useValue: { requireAccess: async () => undefined } },
        { provide: PhotoUrlService, useValue: { attach: async (rows: PipelineRow[]) => rows.map((r) => ({ ...r, photoUrl: null })) } },
      ],
    }).compile();
    controller = moduleRef.get(FollowUpPipelineController);

    // January: a first, a second and an integrated first-timer; one gave pastoral answers.
    pastoralId = await t.visitor({ first: 'Jan-first', firstVisit: '2025-01-05', extra: SECRETS });
    await t.visit(await t.visitor({ first: 'Jan-second', firstVisit: '2025-01-05' }), '2025-01-12');
    await t.entry(await t.visitor({ first: 'Jan-integrated', firstVisit: '2025-01-12' }), 'CONFIRMED');
    // 00:30 Lagos on 1 February, with no first visit date yet: February.
    await t.visitor({ first: 'Feb-midnight', firstVisit: '2025-02-01', extra: { submittedAt: new Date('2025-01-31T23:30:00Z'), firstVisitDate: null } });
    // March: contact logging begins, so March onwards is tracked.
    const third = await t.visitor({ first: 'Mar-third', firstVisit: '2025-03-02' });
    for (const d of ['2025-03-09', '2025-03-16']) await t.visit(third, d);
    await t.entry(await t.visitor({ first: 'Mar-out', firstVisit: '2025-03-02' }), 'OPTED_OUT');
    const reached = await t.visitor({ first: 'Mar-reached', firstVisit: '2025-03-09' });
    await t.entry(reached, 'ASSIGNED');
    await prisma.followUpEntry.updateMany({ where: { visitorId: reached }, data: { firstContactedAt: new Date('2025-03-09T15:00:00Z') } });
    await t.visitor({ first: 'Mar-archived', firstVisit: '2025-03-09', extra: { archivedAt: new Date() } });
    await t.visitor({ first: 'Jun-one', firstVisit: '2025-06-01', extra: { possibleReturnVisitorId: pastoralId } });
  });

  afterAll(async () => {
    await t.cleanup();
    await prisma.$disconnect();
  });

  it('adds up every month card, the year strip to its months, and a month page to its card', async () => {
    const year = await controller.year(t.actor(), 2025);
    expect(year.months).toHaveLength(12);
    expect(year.months.map((m) => m.total)).toEqual([3, 1, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0]);

    for (const [i, card] of year.months.entries()) {
      expect(PIPELINE_STATUSES.reduce((n, s) => n + card.counts[s], 0)).toBe(card.total);

      // The month page, paged two at a time, lists exactly the card's people.
      const seen: string[] = [];
      for (let skip = 0; ; skip += 2) {
        const page = await controller.people(t.actor(), { year: '2025', month: String(i + 1), take: '2', skip: String(skip) });
        expect(page.total).toBe(card.total);
        expect(page.counts.all).toBe(card.total);
        seen.push(...page.rows.map((r) => r.visitorId));
        if (page.rows.length < 2) break;
      }
      expect(new Set(seen).size).toBe(card.total);
      for (const s of PIPELINE_STATUSES) {
        const chip = await controller.people(t.actor(), { year: '2025', month: String(i + 1), status: s });
        expect(chip.total).toBe(card.counts[s]);
      }
    }

    for (const key of ['total', 'due48', 'reached48'] as const) {
      expect(year.total[key]).toBe(year.months.reduce((n, m) => n + m[key], 0));
    }
    for (const s of PIPELINE_STATUSES) expect(year.total.counts[s]).toBe(year.months.reduce((n, m) => n + m.counts[s], 0));
    expect(year.months[0].counts).toEqual({ FIRST_TIMER: 1, SECOND_TIMER: 1, THIRD_TIMER: 0, INTEGRATED: 1, OPTED_OUT: 0 });
    expect(year.months[2].counts).toEqual({ FIRST_TIMER: 1, SECOND_TIMER: 0, THIRD_TIMER: 1, INTEGRATED: 0, OPTED_OUT: 1 });
  });

  it('reads months before contact logging as not tracked, and the 48 hours from March on', async () => {
    const year = await controller.year(t.actor(), 2025);
    expect(year.months.map((m) => m.tracked)).toEqual([false, false, true, true, true, true, true, true, true, true, true, true]);
    expect(year.months[2]).toMatchObject({ due48: 3, reached48: 1 });
    expect(year.total).toMatchObject({ tracked: true, due48: 4, reached48: 1 });
    expect(year.firstYear).toBe(2025);
  });

  it('sends nothing pastoral to the month page, its breakdowns, its expanded rows or its visits', async () => {
    const payloads = [
      await controller.people(t.actor(), { year: '2025', month: '1' }),
      await controller.breakdowns(t.actor(), 2025, 1),
      await controller.year(t.actor(), 2025),
      await controller.answers(t.actor(), pastoralId),
      await visits.list(pastoralId),
    ];
    for (const payload of payloads) {
      const json = JSON.stringify(payload);
      for (const [key, secret] of Object.entries(SECRETS)) {
        expect(json).not.toContain(secret);
        expect(json).not.toContain(`"${key}"`);
      }
    }
    // The profile, and only the profile, has them (proof the seed reached the database); the prayer request only for pastors and admins.
    const forTeam = JSON.stringify(await controller.person(t.actor(), pastoralId));
    expect(forTeam).toContain(SECRETS.serviceExperience);
    expect(forTeam).not.toContain(SECRETS.prayerPoint);
    expect(JSON.stringify(await controller.person({ ...t.actor(), effectiveRoles: [Role.PASTOR] }, pastoralId))).toContain(SECRETS.prayerPoint);
  });
});
