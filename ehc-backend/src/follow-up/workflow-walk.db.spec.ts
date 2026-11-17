import { PrismaClient, Role } from '@prisma/client';
import type { MonthSummary, PipelineStatus } from '../pipeline/pipeline.types';
import { testDbUrl, workflowFixture, type Person } from './testing/workflow.fixture-spec';
import { FollowUpAutoSurfaceFirstTimersService } from './services/follow-up-auto-surface-first-timers.service';
import { FollowUpUnitLeaderLookupService } from './services/follow-up-unit-leader-lookup.service';
import { FollowUpAutoAssignService } from './services/follow-up-auto-assign.service';
import { FollowUpAssignableService } from './services/follow-up-assignable.service';
import { FirstTimerVisitsService } from './visits/first-timer-visits.service';
import { FollowUpEvent } from './events/follow-up-events';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import { OpeningMessageService } from '../message-templates/opening-message.service';
import { DailyEmailBudget } from '../message-templates/email-budget.service';
import { OPENING_TEMPLATE_V1 } from '../message-templates/opening-template.seed';
import { OPENING_KEY } from '../message-templates/template-variables';

/**
 * The whole first-timer workflow from spec section 2, walked end to end on a
 * tenant of its own (Phase 3, step 2): a student registers in January and is
 * proposed to the least-loaded of the pool, a team lead approves the
 * assignment, the Guest Care Coordinator is told and
 * sends on WhatsApp, which stamps the first contact, two return visits make
 * them a Second then a Third timer, the assignee asks for approval, the unit
 * lead approves, admins hear, the person is Integrated and the admins are
 * asked to create their account. After every step
 * each count that should move changes by exactly one, everywhere it is shown:
 * the January card, the year strip, and the list with its status chips.
 *
 * Runs against a disposable Postgres (PIPELINE_TEST_DATABASE_URL); skipped otherwise.
 */
const maybe = testDbUrl ? describe : describe.skip;
jest.setTimeout(120_000);

type Snapshot = Record<string, number>;
const STATUSES: PipelineStatus[] = ['FIRST_TIMER', 'SECOND_TIMER', 'THIRD_TIMER', 'INTEGRATED', 'OPTED_OUT'];

maybe('The first-timer workflow, walked end to end', () => {
  const prisma = testDbUrl ? new PrismaClient({ datasources: { db: { url: testDbUrl } } }) : (null as unknown as PrismaClient);
  const fx = workflowFixture(prisma);
  let svc: ReturnType<typeof fx.services>;
  let surface: FollowUpAutoSurfaceFirstTimersService;
  let visits: FirstTimerVisitsService;
  let opening: OpeningMessageService;
  let unit: string;
  let department: string;
  let lead: Person, arewa: Person, mosun: Person, adeyemi: Person, gift: Person, pastor: Person, admin: Person, head: Person;

  /** Every figure that shows this person, read the way each page reads it. */
  async function snapshot(): Promise<Snapshot> {
    const year = await svc.pipeline.year(2026, new Date('2026-11-17T12:00:00Z'));
    const january = year.months.find((m) => m.month === '2026-01-01') as MonthSummary;
    const page = await svc.pipeline.list({ year: 2026, month: 1, take: 200 });
    const out: Snapshot = { 'january.total': january.total, 'year.total': year.total.total, 'list.all': page.counts.all, 'list.rows': page.rows.length };
    for (const s of STATUSES) {
      out[`january.${s}`] = january.counts[s];
      out[`year.${s}`] = year.total.counts[s];
      out[`list.${s}`] = page.counts[s];
    }
    return out;
  }
  /** What moved since `before`, by how much. */
  const moved = (before: Snapshot, after: Snapshot) =>
    Object.fromEntries(Object.keys(after).filter((k) => after[k] !== before[k]).map((k) => [k, after[k] - before[k]]));
  /** Each status that moved, on all three readings at once. */
  const everywhere = (changes: Partial<Record<PipelineStatus | 'total', number>>) =>
    Object.fromEntries(
      Object.entries(changes).flatMap(([s, n]) =>
        s === 'total'
          ? [['january.total', n], ['year.total', n], ['list.all', n], ['list.rows', n]]
          : [[`january.${s}`, n], [`year.${s}`, n], [`list.${s}`, n]],
      ),
    );
  const told = async (type: string, visitorId: string, kind?: string) => {
    const events = await prisma.outboxEvent.findMany({ where: { tenantId: fx.tenantId, type } });
    const event = events.find((e) => {
      const p = e.payload as { visitorId?: string; kind?: string };
      return p.visitorId === visitorId && (!kind || p.kind === kind);
    });
    if (!event) return [];
    return (await prisma.notification.findMany({ where: { eventId: event.id, channel: 'in_app' } })).map((n) => n.profileId).sort();
  };

  beforeAll(async () => {
    await fx.init();
    svc = fx.services();
    department = await fx.department('Membership and Assimilation');
    unit = await fx.unit('Follow-Up', department);
    lead = await fx.person('Opeyemi', { unitIds: [unit] });
    await fx.lead(unit, lead.profileId);
    head = await fx.person('Olasunkanmi');
    await fx.head(department, head.profileId);
    arewa = await fx.person('Arewa');
    await prisma.firstTimerContactAssignment.create({ data: { id: fx.id(), tenantId: fx.tenantId, userId: arewa.profileId } });
    [mosun, adeyemi, gift] = [
      await fx.person('Mosun', { unitIds: [unit] }), await fx.person('Adeyemi', { unitIds: [unit] }), await fx.person('Gift', { unitIds: [unit] }),
    ];
    pastor = await fx.person('Pastor', { roles: [Role.PASTOR] });
    admin = await fx.person('Admin', { roles: [Role.ADMIN_HEAD] });

    // Today's caseloads: Mosun one, Adeyemi two, Gift none open (her integrated case is closed work).
    const caseload = async (who: Person, stage: 'ASSIGNED' | 'CONFIRMED') =>
      fx.entry(await fx.firstTimer(`Earlier-${who.memberId.slice(0, 4)}`, { isStudent: false }), unit, lead.profileId, who.memberId, stage, new Date('2026-01-02T10:00:00Z'));
    await caseload(mosun, 'ASSIGNED');
    await caseload(adeyemi, 'ASSIGNED');
    await caseload(adeyemi, 'ASSIGNED');
    await caseload(gift, 'CONFIRMED');

    await prisma.routingRule.create({
      data: {
        id: fx.id(), tenantId: fx.tenantId, name: 'Students', segment: 'STUDENT', unitId: unit,
        Members: { create: [mosun, adeyemi, gift].map((p) => ({ id: fx.id(), memberId: p.memberId })) },
      },
    });

    const config = svc.config;
    const leaders = new FollowUpUnitLeaderLookupService(prisma as never, config);
    const assignable = new FollowUpAssignableService(prisma as never, config);
    surface = new FollowUpAutoSurfaceFirstTimersService(prisma as never, leaders, new FollowUpAutoAssignService(prisma as never, assignable, config), svc.outbox, config);
    visits = new FirstTimerVisitsService(prisma as never, svc.pipeline, config);
    const templates = new MessageTemplatesService(prisma as never, config);
    opening = new OpeningMessageService(prisma as never, templates, svc.pipeline, new DailyEmailBudget(prisma as never), { deliver: jest.fn() } as never, svc.auth, config);
    await templates.save(fx.actor(arewa, { roles: [Role.FIRST_TIMER_CONTACT] }), OPENING_KEY, OPENING_TEMPLATE_V1);
  });

  afterAll(async () => {
    const t = { where: { tenantId: fx.tenantId } };
    await prisma.messageLog.deleteMany(t);
    await prisma.messageTemplate.deleteMany(t);
    await prisma.followUpContactLog.deleteMany(t);
    await fx.cleanup();
    await prisma.$disconnect();
  });

  it('takes a January student from registration to Integrated, one count at a time', async () => {
    // 1. A student registers in January and is proposed to the least-loaded of the three.
    let before = await snapshot();
    const visitorId = await fx.firstTimer('Tolu', {
      isStudent: true, phone: '08031234567', firstVisitDate: new Date('2026-01-11T00:00:00Z'), submittedAt: new Date('2026-01-11T09:30:00Z'),
    });
    await prisma.firstTimerVisit.create({ data: { id: fx.id(), tenantId: fx.tenantId, visitorId, visitedOn: new Date('2026-01-11T00:00:00Z'), source: 'FORM' } });
    await surface.onVisitorCreated({ visitorIds: [visitorId] });

    const entry = await prisma.followUpEntry.findFirstOrThrow({ where: { visitorId } });
    expect(entry).toMatchObject({ assigneeId: null, unitId: unit, stage: 'UNASSIGNED' });
    let after = await snapshot();
    expect(moved(before, after)).toEqual(everywhere({ total: 1, FIRST_TIMER: 1 }));
    // Arewa hears about the registration; both team leads are asked to approve Gift.
    expect(await told(FollowUpEvent.Registered, visitorId)).toEqual([arewa.profileId]);
    expect(await told(FollowUpEvent.ApprovalRequested, visitorId, 'FIRST_TIMER_ASSIGNMENT')).toEqual([lead.profileId, head.profileId].sort());

    // Either team lead approves: here the department head. Gift hears; no count moves.
    before = after;
    const proposal = await prisma.approvalRequest.findFirstOrThrow({ where: { subjectId: visitorId, kind: 'FIRST_TIMER_ASSIGNMENT' } });
    expect((proposal.payload as { assigneeId: string }).assigneeId).toBe(gift.memberId);
    await svc.approvals.decide(fx.actor(head, { hodOf: [department] }), proposal.id, { decision: 'APPROVED' });
    expect(await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entry.id } })).toMatchObject({ assigneeId: gift.memberId, stage: 'ASSIGNED' });
    expect(await told(FollowUpEvent.Assigned, visitorId)).toEqual([gift.profileId]);
    after = await snapshot();
    expect(moved(before, after)).toEqual({});

    // 2. Arewa sends the opening message on WhatsApp: the first contact is stamped; no count moves.
    before = after;
    const context = await opening.context(fx.actor(arewa, { roles: [Role.FIRST_TIMER_CONTACT] }), visitorId);
    expect(context.whatsapp?.link).toMatch(/^https:\/\/wa\.me\/2348031234567\?text=/);
    await opening.logWhatsApp(fx.actor(arewa, { roles: [Role.FIRST_TIMER_CONTACT] }), visitorId, context.template?.version ?? 0);
    expect((await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entry.id } })).firstContactedAt).not.toBeNull();
    after = await snapshot();
    expect(moved(before, after)).toEqual({});

    // 3. Two return visits: a Second timer, then a Third timer.
    before = after;
    await visits.cameAgain(fx.actor(gift), visitorId, '2026-01-18');
    after = await snapshot();
    expect(moved(before, after)).toEqual(everywhere({ FIRST_TIMER: -1, SECOND_TIMER: 1 }));

    before = after;
    await visits.cameAgain(fx.actor(gift), visitorId, '2026-01-25');
    after = await snapshot();
    expect(moved(before, after)).toEqual(everywhere({ SECOND_TIMER: -1, THIRD_TIMER: 1 }));

    // 4. Gift asks for approval; the team leads are told.
    before = after;
    const asked = await svc.approvals.request(fx.actor(gift), { visitorId, note: 'Ready to join the choir' });
    expect((await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entry.id } })).stage).toBe('AWAITING_REVIEW');
    expect(await told(FollowUpEvent.ApprovalRequested, visitorId, 'FIRST_TIMER_INTEGRATION')).toEqual([lead.profileId, head.profileId].sort());
    expect(moved(before, await snapshot())).toEqual({});

    // 5. The lead approves: Integrated, and the pastor, admins, the department head and Gift hear.
    before = await snapshot();
    expect(asked.latest?.status).toBe('PENDING');
    await svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), asked.latest?.id as string, { decision: 'APPROVED' });
    expect((await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entry.id } })).stage).toBe('CONFIRMED');
    expect((await svc.pipeline.one(visitorId))?.status).toBe('INTEGRATED');
    after = await snapshot();
    expect(moved(before, after)).toEqual(everywhere({ THIRD_TIMER: -1, INTEGRATED: 1 }));
    expect(await told(FollowUpEvent.ApprovalDecided, visitorId)).toEqual([pastor.profileId, admin.profileId, head.profileId, gift.profileId].sort());

    // 6. They have no account yet, so the admins are asked to create one.
    expect(await told(FollowUpEvent.ApprovalRequested, visitorId, 'MEMBER_ACCOUNT')).toEqual([admin.profileId]);

    // Every card and strip still adds up to its total.
    const year = await svc.pipeline.year(2026, new Date('2026-11-17T12:00:00Z'));
    for (const m of [...year.months, year.total]) expect(STATUSES.reduce((n, s) => n + m.counts[s], 0)).toBe(m.total);
  });
});
