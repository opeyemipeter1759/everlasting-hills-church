import { PrismaClient, Role } from '@prisma/client';
import { testDbUrl, workflowFixture, type Person } from '../testing/workflow.fixture-spec';
import { FollowUpAutoSurfaceFirstTimersService } from '../services/follow-up-auto-surface-first-timers.service';
import { FollowUpUnitLeaderLookupService } from '../services/follow-up-unit-leader-lookup.service';
import { FollowUpAutoAssignService } from '../services/follow-up-auto-assign.service';
import { FollowUpAssignableService } from '../services/follow-up-assignable.service';
import { FollowUpIntakeService } from '../services/follow-up-intake.service';
import { FollowUpEvent } from '../events/follow-up-events';

/**
 * Routing new registrations, against a disposable Postgres with the migrations
 * applied (spec section 6, tests 14 and 17). Set PIPELINE_TEST_DATABASE_URL to
 * run it; skipped otherwise. It seeds a tenant of its own and deletes it after.
 */
const maybe = testDbUrl ? describe : describe.skip;
jest.setTimeout(60_000);

maybe('Routing rules against Postgres', () => {
  const prisma = testDbUrl ? new PrismaClient({ datasources: { db: { url: testDbUrl } } }) : (null as unknown as PrismaClient);
  const fx = workflowFixture(prisma);
  let svc: ReturnType<typeof fx.services>;
  let surface: FollowUpAutoSurfaceFirstTimersService;
  let intake: FollowUpIntakeService;
  let unit: string;
  let ruleId: string;
  let lead: Person, contact: Person, m1: Person, m2: Person, m3: Person, m4: Person, gone: Person, admin: Person;

  async function register(name: string, isStudent: boolean | null = true) {
    const visitorId = await fx.firstTimer(name, { isStudent });
    await surface.onVisitorCreated({ visitorIds: [visitorId] });
    return { visitorId, entry: await prisma.followUpEntry.findFirstOrThrow({ where: { visitorId } }) };
  }
  const told = async (type: string, visitorId: string) => {
    const event = (await prisma.outboxEvent.findMany({ where: { tenantId: fx.tenantId, type } })).find(
      (e) => (e.payload as { visitorId?: string }).visitorId === visitorId,
    );
    if (!event) return null;
    return (await prisma.notification.findMany({ where: { eventId: event.id, channel: 'in_app' } })).map((n) => n.profileId);
  };

  beforeAll(async () => {
    await fx.init();
    svc = fx.services();
    unit = await fx.unit('Follow-Up', await fx.department('Membership and Assimilation'));
    lead = await fx.person('Lead');
    await fx.lead(unit, lead.profileId);
    contact = await fx.person('Contact');
    await prisma.firstTimerContactAssignment.create({ data: { id: fx.id(), tenantId: fx.tenantId, userId: contact.profileId } });
    [m1, m2, m3, m4] = [await fx.person('Mone', { unitIds: [unit] }), await fx.person('Mtwo', { unitIds: [unit] }),
      await fx.person('Mthree', { unitIds: [unit] }), await fx.person('Mfour', { unitIds: [unit] })];
    gone = await fx.person('Gone', { unitIds: [unit] });
    await prisma.member.update({ where: { id: gone.memberId }, data: { status: 'INACTIVE' } });
    admin = await fx.person('Admin', { roles: [Role.ADMIN] });

    // Today's load: Mone and Mtwo one open each (Mone given hers first); closed work never counts.
    const old = async (name: string, who: Person, stage: 'ASSIGNED' | 'CONFIRMED' | 'OPTED_OUT', at: string) =>
      fx.entry(await fx.firstTimer(name, { isStudent: false }), unit, lead.profileId, who.memberId, stage, new Date(at));
    await old('Old-one', m1, 'ASSIGNED', '2026-01-01T10:00:00Z');
    await old('Old-two', m2, 'ASSIGNED', '2026-01-05T10:00:00Z');
    await old('Old-done', m1, 'CONFIRMED', '2026-01-02T10:00:00Z');
    await old('Old-out', m4, 'OPTED_OUT', '2026-01-02T10:00:00Z');
    for (let i = 0; i < 3; i++) await old(`Busy-${i}`, m4, 'ASSIGNED', '2026-01-03T10:00:00Z');

    ruleId = fx.id();
    await prisma.routingRule.create({
      data: {
        id: ruleId, tenantId: fx.tenantId, name: 'Students', segment: 'STUDENT', unitId: unit,
        Members: { create: [m1, m2, m3, gone].map((p) => ({ id: fx.id(), memberId: p.memberId })) },
      },
    });

    const config = svc.config;
    const leaders = new FollowUpUnitLeaderLookupService(prisma as never, config);
    const assignable = new FollowUpAssignableService(prisma as never, config);
    const autoAssign = new FollowUpAutoAssignService(prisma as never, assignable, config);
    surface = new FollowUpAutoSurfaceFirstTimersService(prisma as never, leaders, autoAssign, svc.outbox, config);
    const mapper = { mapEntry: () => ({ person: { name: 'someone' } }) };
    intake = new FollowUpIntakeService(
      prisma as never, svc.auth, mapper as never, { write: jest.fn() } as never, autoAssign,
      { notifyAssigned: jest.fn() } as never, leaders, assignable, config, svc.outbox,
    );
  });

  afterAll(async () => {
    await fx.cleanup();
    await prisma.$disconnect();
  });

  it('a student goes to the least-loaded person in the pool, under the rule\'s unit, and both people hear', async () => {
    const { visitorId, entry } = await register('Ada');
    // Mthree has never been given anyone; Gone has no load either but is inactive.
    expect(entry).toMatchObject({ assigneeId: m3.memberId, unitId: unit, routingRuleId: ruleId, stage: 'ASSIGNED' });
    expect(entry.assignedAt).toBeInstanceOf(Date);
    const history = await prisma.followUpStageHistory.findFirst({ where: { entryId: entry.id } });
    expect(history).toMatchObject({ fromStage: 'UNASSIGNED', toStage: 'ASSIGNED', reason: 'ASSIGNED' });
    expect(await told(FollowUpEvent.Registered, visitorId)).toEqual([contact.profileId]);
    expect(await told(FollowUpEvent.Assigned, visitorId)).toEqual([m3.profileId]);
  });

  it('a tie goes to whoever was given someone least recently', async () => {
    expect((await register('Bola')).entry.assigneeId).toBe(m1.memberId); // 1, 1, 1: Mone was given hers first
    expect((await register('Chidi')).entry.assigneeId).toBe(m2.memberId); // 2, 1, 1: Mtwo before Mthree
  });

  it('two registrations at the same moment never land on the same person', async () => {
    // Now 2, 2, 1: one goes to Mthree, and the other must see that and go to Mone.
    const [a, b] = await Promise.all([fx.firstTimer('Dayo', { isStudent: true }), fx.firstTimer('Efe', { isStudent: true })]);
    await Promise.all([surface.onVisitorCreated({ visitorIds: [a] }), surface.onVisitorCreated({ visitorIds: [b] })]);
    const got = await prisma.followUpEntry.findMany({ where: { visitorId: { in: [a, b] } }, select: { assigneeId: true } });
    expect(got.map((e) => e.assigneeId).sort()).toEqual([m1.memberId, m3.memberId].sort());
  });

  it('with no matching rule it keeps today\'s behaviour, and the contact still hears', async () => {
    const { visitorId, entry } = await register('Funmi', false);
    expect(entry.routingRuleId).toBeNull();
    expect(entry.unitId).toBe(unit);
    expect(await told(FollowUpEvent.Registered, visitorId)).toEqual([contact.profileId]);
  });

  it("an admin's reassignment wins, and no later sweep undoes it", async () => {
    const { visitorId, entry } = await register('Gbenga');
    expect(entry.routingRuleId).toBe(ruleId);
    await intake.assign(fx.actor(admin, { roles: [Role.ADMIN] }), entry.id, { assigneeId: m4.memberId });
    const after = await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entry.id } });
    expect(after).toMatchObject({ assigneeId: m4.memberId, unitId: unit, routingRuleId: null });
    expect(after.assignedAt!.getTime()).toBeGreaterThanOrEqual(entry.assignedAt!.getTime());
    const assigned = (await prisma.outboxEvent.findMany({ where: { tenantId: fx.tenantId, type: FollowUpEvent.Assigned } })).filter(
      (e) => (e.payload as { visitorId?: string }).visitorId === visitorId,
    );
    expect(assigned).toHaveLength(2);

    await surface.run(new Map(), unit);
    expect((await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entry.id } })).assigneeId).toBe(m4.memberId);
  });

  it('a switched-off rule routes nobody', async () => {
    await prisma.routingRule.update({ where: { id: ruleId }, data: { active: false } });
    expect((await register('Hauwa')).entry.routingRuleId).toBeNull();
    await prisma.routingRule.update({ where: { id: ruleId }, data: { active: true } });
  });

  it('notifications and pushes carry a first name and an action: no surname, nothing pastoral', async () => {
    const rows = await prisma.notification.findMany({ where: { tenantId: fx.tenantId } });
    expect(rows.length).toBeGreaterThan(0);
    const pushed = JSON.stringify(svc.push.dispatch.mock.calls);
    for (const text of [JSON.stringify(rows), pushed]) {
      expect(text).not.toMatch(/Okonkwo-Secret/);
      expect(text).not.toMatch(/private family matter/);
    }
    expect(svc.push.dispatch).toHaveBeenCalled();
  });
});
