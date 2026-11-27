import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { testDbUrl, workflowFixture, type Person } from '../testing/workflow.fixture-spec';
import { assignEntry } from '../routing/assignment';
import { FollowUpEvent } from '../events/follow-up-events';
import { resolveMemberAccount } from './account-approval';

/**
 * Approvals against a disposable Postgres with the migrations applied (spec
 * section 6, tests 11, 12 and 13). Set PIPELINE_TEST_DATABASE_URL to run it;
 * skipped otherwise. It seeds a tenant of its own and deletes it afterwards.
 */
const maybe = testDbUrl ? describe : describe.skip;
jest.setTimeout(60_000);

maybe('Approvals against Postgres', () => {
  const prisma = testDbUrl ? new PrismaClient({ datasources: { db: { url: testDbUrl } } }) : (null as unknown as PrismaClient);
  const fx = workflowFixture(prisma);
  let svc: ReturnType<typeof fx.services>;
  let dept: string;
  let unit: string;
  let leaderless: string;
  let assignee: Person, lead: Person, newLead: Person, outsider: Person, head: Person, admin: Person, pastor: Person;
  let leadAssignment: string;

  const requestFor = async (visitorId: string, by = assignee) => svc.approvals.request(fx.actor(by), { visitorId, note: 'Ready to join' });
  const pendingId = async (visitorId: string) =>
    (await prisma.approvalRequest.findFirstOrThrow({ where: { subjectId: visitorId, status: 'PENDING' } })).id;
  const stageOf = async (visitorId: string) => (await prisma.followUpEntry.findFirstOrThrow({ where: { visitorId } })).stage;
  const events = (type: string) => prisma.outboxEvent.findMany({ where: { tenantId: fx.tenantId, type } });

  /** A first-timer in follow-up with the assignee, under the given unit. */
  async function firstTimer(name: string, unitId = unit) {
    const visitorId = await fx.firstTimer(name);
    await fx.entry(visitorId, unitId, admin.profileId, assignee.memberId);
    return visitorId;
  }

  beforeAll(async () => {
    await fx.init();
    svc = fx.services();
    dept = await fx.department('Membership and Assimilation');
    unit = await fx.unit('Follow-Up', dept);
    leaderless = await fx.unit('Integration Team', dept);
    assignee = await fx.person('Mosun', { unitIds: [unit, leaderless] });
    lead = await fx.person('Lead', { unitIds: [unit] });
    newLead = await fx.person('Newlead', { unitIds: [unit] });
    outsider = await fx.person('Outsider', { unitIds: [unit] });
    head = await fx.person('Head');
    admin = await fx.person('Admin', { roles: [Role.ADMIN] });
    // The pastor also heads the department: two reasons to hear about a decision, one notification.
    pastor = await fx.person('Pastor', { roles: [Role.PASTOR] });
    await fx.head(dept, head.profileId);
    await fx.head(dept, pastor.profileId);
    leadAssignment = await fx.lead(unit, lead.profileId);
  });

  afterAll(async () => {
    await fx.cleanup();
    await prisma.$disconnect();
  });

  it("asking moves them to awaiting review and tells the unit's team leads: its lead and the department heads", async () => {
    const visitorId = await firstTimer('Ada');
    const view = await requestFor(visitorId);
    expect(view.latest?.status).toBe('PENDING');
    expect(view.deciders?.level).toBe('LEAD');
    expect([...(view.deciders?.names ?? [])].sort()).toEqual(['Head Staffperson', 'Lead Staffperson', 'Pastor Staffperson']);
    expect(await stageOf(visitorId)).toBe('AWAITING_REVIEW');
    const [event] = (await events(FollowUpEvent.ApprovalRequested)).filter((e) => (e.payload as { visitorId: string }).visitorId === visitorId);
    const told = await prisma.notification.findMany({ where: { eventId: event.id, channel: 'in_app' }, select: { profileId: true } });
    expect(told.map((n) => n.profileId).sort()).toEqual([lead.profileId, head.profileId, pastor.profileId].sort());
    // A second request while one is pending is refused.
    await expect(requestFor(visitorId)).rejects.toBeInstanceOf(ConflictException);
  });

  it('only the assignee or an admin may ask', async () => {
    const visitorId = await firstTimer('Bola');
    await expect(svc.approvals.request(fx.actor(outsider), { visitorId, note: 'Ready' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.approvals.request(fx.actor(admin, { roles: [Role.ADMIN] }), { visitorId, note: 'Ready' })).resolves.toMatchObject({ latest: { status: 'PENDING' } });
  });

  it('two decisions at the same moment: exactly one wins, and only it leaves an event', async () => {
    const visitorId = await firstTimer('Chidi');
    await requestFor(visitorId);
    const id = await pendingId(visitorId);
    const results = await Promise.allSettled([
      svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), id, { decision: 'APPROVED' }),
      svc.approvals.decide(fx.actor(admin, { roles: [Role.ADMIN] }), id, { decision: 'CHANGES_REQUESTED', note: 'One more call' }),
      svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), id, { decision: 'APPROVED' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    for (const r of results.filter((r) => r.status === 'rejected')) expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);

    const decided = await prisma.approvalRequest.findUniqueOrThrow({ where: { id } });
    expect(await stageOf(visitorId)).toBe(decided.status === 'APPROVED' ? 'CONFIRMED' : 'REOPENED');
    const mine = (await events(FollowUpEvent.ApprovalDecided)).filter((e) => (e.payload as { approvalId: string }).approvalId === id);
    expect(mine).toHaveLength(1);
  });

  it('someone who is not a team lead gets 403; the department head decides alongside the lead', async () => {
    const visitorId = await firstTimer('Dayo');
    await requestFor(visitorId);
    const id = await pendingId(visitorId);
    await expect(svc.approvals.decide(fx.actor(outsider), id, { decision: 'APPROVED' })).rejects.toBeInstanceOf(ForbiddenException);
    expect((await prisma.approvalRequest.findUniqueOrThrow({ where: { id } })).status).toBe('PENDING');
    const view = await svc.approvals.decide(fx.actor(head, { hodOf: [dept] }), id, { decision: 'APPROVED' });
    expect(view.latest).toMatchObject({ status: 'APPROVED', deciderName: 'Head Staffperson', adminOverride: false });
  });

  it('after the lead changes, the new lead decides and the old one cannot, with no data moved', async () => {
    const visitorId = await firstTimer('Efe');
    await requestFor(visitorId);
    const id = await pendingId(visitorId);
    await prisma.unitLeadAssignment.update({ where: { id: leadAssignment }, data: { endedAt: new Date() } });
    await fx.lead(unit, newLead.profileId);
    try {
      // The old lead's cached role set still names the unit: the decision reads the assignment rows instead.
      await expect(svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), id, { decision: 'APPROVED' })).rejects.toBeInstanceOf(ForbiddenException);
      const view = await svc.approvals.decide(fx.actor(newLead), id, { decision: 'APPROVED', note: 'Welcome' });
      expect(view.latest).toMatchObject({ status: 'APPROVED', deciderName: 'Newlead Staffperson', adminOverride: false });
      expect(await stageOf(visitorId)).toBe('CONFIRMED');
    } finally {
      await prisma.unitLeadAssignment.updateMany({ where: { unitId: unit, userId: newLead.profileId }, data: { endedAt: new Date() } });
      leadAssignment = await fx.lead(unit, lead.profileId);
    }
  });

  it('a unit with no lead goes to the department head', async () => {
    const visitorId = await firstTimer('Funmi', leaderless);
    const view = await requestFor(visitorId);
    expect(view.deciders?.level).toBe('HEAD');
    const [event] = (await events(FollowUpEvent.ApprovalRequested)).filter((e) => (e.payload as { visitorId: string }).visitorId === visitorId);
    const told = await prisma.notification.findMany({ where: { eventId: event.id, channel: 'in_app' }, select: { profileId: true } });
    expect(told.map((n) => n.profileId).sort()).toEqual([head.profileId, pastor.profileId].sort());
    const decided = await svc.approvals.decide(fx.actor(head, { hodOf: [dept] }), await pendingId(visitorId), { decision: 'APPROVED' });
    expect(decided.latest?.adminOverride).toBe(false);
  });

  it('an admin may override the lead: flagged and audited', async () => {
    const visitorId = await firstTimer('Gbenga');
    await requestFor(visitorId);
    const id = await pendingId(visitorId);
    const view = await svc.approvals.decide(fx.actor(admin, { roles: [Role.ADMIN] }), id, { decision: 'CHANGES_REQUESTED', note: 'Call again first' });
    expect(view.latest).toMatchObject({ status: 'CHANGES_REQUESTED', adminOverride: true, decisionNote: 'Call again first' });
    expect(await stageOf(visitorId)).toBe('REOPENED');
    const audit = await prisma.auditLog.findFirst({ where: { tenantId: fx.tenantId, entity: 'ApprovalRequest', entityId: id } });
    expect(audit?.action).toBe('APPROVAL_ADMIN_OVERRIDE');
  });

  it('reassigning cancels a pending request and puts them back in follow-up', async () => {
    const visitorId = await firstTimer('Hauwa');
    await requestFor(visitorId);
    const id = await pendingId(visitorId);
    const entry = await prisma.followUpEntry.findFirstOrThrow({ where: { visitorId } });
    const result = await prisma.$transaction((tx) =>
      assignEntry(tx, svc.outbox, { tenantId: fx.tenantId, entryId: entry.id, assigneeId: outsider.memberId, unitId: unit, actorId: admin.profileId }),
    );
    expect(result.cancelledApprovals).toBe(1);
    expect((await prisma.approvalRequest.findUniqueOrThrow({ where: { id } })).status).toBe('CANCELLED');
    expect(await stageOf(visitorId)).toBe('ASSIGNED');
    await expect(svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), id, { decision: 'APPROVED' })).rejects.toBeInstanceOf(ConflictException);
  });

  it("a lead's queue holds only their own unit's requests; nobody else's queue holds them", async () => {
    const mineId = await firstTimer('Ife');
    const otherId = await firstTimer('Jide', leaderless);
    await requestFor(mineId);
    await requestFor(otherId);
    const leadQueue = await svc.approvals.queue(fx.actor(lead, { unitLeadOf: [unit] }));
    expect(leadQueue.every((q) => q.unitId === unit)).toBe(true);
    expect(leadQueue.map((q) => q.subjectId)).toContain(mineId);
    expect(leadQueue.map((q) => q.subjectId)).not.toContain(otherId);
    // The department head is a team lead of every unit in the department.
    const headQueue = await svc.approvals.queue(fx.actor(head, { hodOf: [dept] }));
    expect(headQueue.map((q) => q.subjectId)).toEqual(expect.arrayContaining([mineId, otherId]));
    expect(await svc.approvals.queue(fx.actor(outsider))).toEqual([]);
    const adminQueue = await svc.approvals.queue(fx.actor(admin, { roles: [Role.ADMIN] }));
    expect(adminQueue.find((q) => q.subjectId === mineId)?.asOverride).toBe(true);
  });

  it('an approved integration asks the admins for an account, which only an admin can clear', async () => {
    const visitorId = await firstTimer('Mide');
    await requestFor(visitorId);
    await svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), await pendingId(visitorId), { decision: 'APPROVED' });
    const account = await prisma.approvalRequest.findFirstOrThrow({ where: { subjectId: visitorId, kind: 'MEMBER_ACCOUNT' } });
    expect(account.status).toBe('PENDING');

    // The admins hear (the decider is no admin); team leads cannot decide it.
    const [event] = (await events(FollowUpEvent.ApprovalRequested)).filter((e) => (e.payload as { approvalId: string }).approvalId === account.id);
    const told = await prisma.notification.findMany({ where: { eventId: event.id, channel: 'in_app' }, select: { profileId: true } });
    expect(told.map((n) => n.profileId)).toEqual([admin.profileId]);
    await expect(svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), account.id, { decision: 'APPROVED' })).rejects.toBeInstanceOf(ForbiddenException);
    expect((await svc.approvals.queue(fx.actor(admin, { roles: [Role.ADMIN] }))).some((q) => q.id === account.id)).toBe(true);

    // Approving by hand needs the account to exist; creating the account answers it.
    await expect(svc.approvals.decide(fx.actor(admin, { roles: [Role.ADMIN] }), account.id, { decision: 'APPROVED' })).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.$transaction((tx) => resolveMemberAccount(tx, { tenantId: fx.tenantId, visitorId, actorId: admin.profileId }))).toBe(1);
    expect((await prisma.approvalRequest.findUniqueOrThrow({ where: { id: account.id } })).status).toBe('APPROVED');
  });

  it('an admin can set an account request aside without a note', async () => {
    const visitorId = await firstTimer('Nike');
    await requestFor(visitorId);
    await svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), await pendingId(visitorId), { decision: 'APPROVED' });
    const account = await prisma.approvalRequest.findFirstOrThrow({ where: { subjectId: visitorId, kind: 'MEMBER_ACCOUNT' } });
    await svc.approvals.decide(fx.actor(admin, { roles: [Role.ADMIN] }), account.id, { decision: 'CHANGES_REQUESTED' });
    expect((await prisma.approvalRequest.findUniqueOrThrow({ where: { id: account.id } })).status).toBe('CHANGES_REQUESTED');
  });

  it("shows Approvals only to whoever decides first-timer approvals, not to every unit lead", async () => {
    const canDecide = async (p: Person, roles: Role[] = []) => (await svc.approvals.access(fx.actor(p, { roles }))).canDecide;
    const audio = await fx.unit('Audio and Video');
    const toni = await fx.person('Toni', { unitIds: [audio] });
    await fx.lead(audio, toni.profileId);
    await prisma.routingRule.create({ data: { id: randomUUID(), tenantId: fx.tenantId, name: 'Everyone', segment: 'NOT_STUDENT', unitId: unit } });

    expect(await canDecide(toni)).toBe(false);
    expect(await canDecide(outsider)).toBe(false);
    expect(await canDecide(head)).toBe(true);
    expect(await canDecide(admin, [Role.ADMIN])).toBe(true);
  });

  describe('events', () => {
    it('a rolled-back decision leaves no event and no change', async () => {
      const visitorId = await firstTimer('Kemi');
      await requestFor(visitorId);
      const id = await pendingId(visitorId);
      const record = svc.outbox.record.bind(svc.outbox);
      const spy = jest.spyOn(svc.outbox, 'record').mockImplementationOnce(async (tx, input) => {
        await record(tx, input);
        throw new Error('the commit failed');
      });
      await expect(svc.approvals.decide(fx.actor(lead, { unitLeadOf: [unit] }), id, { decision: 'APPROVED' })).rejects.toThrow('the commit failed');
      spy.mockRestore();
      expect((await prisma.approvalRequest.findUniqueOrThrow({ where: { id } })).status).toBe('PENDING');
      expect(await stageOf(visitorId)).toBe('AWAITING_REVIEW');
      const left = (await events(FollowUpEvent.ApprovalDecided)).filter((e) => (e.payload as { approvalId: string }).approvalId === id);
      expect(left).toHaveLength(0);
    });

    it('tells each watcher once, never the actor, and a sweeper retry adds nothing', async () => {
      const visitorId = await firstTimer('Lola');
      await requestFor(visitorId);
      const id = await pendingId(visitorId);
      await svc.approvals.decide(fx.actor(admin, { roles: [Role.ADMIN] }), id, { decision: 'APPROVED' });
      const [event] = (await events(FollowUpEvent.ApprovalDecided)).filter((e) => (e.payload as { approvalId: string }).approvalId === id);
      const told = async () => (await prisma.notification.findMany({ where: { eventId: event.id, channel: 'in_app' }, select: { profileId: true } })).map((n) => n.profileId);

      // The admin decided: a watcher, but the actor. The pastor is a watcher and a department head: once.
      const first = await told();
      expect(first.sort()).toEqual([pastor.profileId, head.profileId, assignee.profileId].sort());
      await prisma.outboxEvent.update({ where: { id: event.id }, data: { status: 'PENDING', nextAttemptAt: new Date(0) } });
      await svc.outbox.sweep();
      expect((await told()).length).toBe(first.length);
    });
  });
});
