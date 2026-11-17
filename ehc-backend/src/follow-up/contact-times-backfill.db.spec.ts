import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { applyContactTimes, planContactTimes } from '../../scripts/followup-v2/backfill-contact-times';

/**
 * scripts/followup-v2/backfill-contact-times against a disposable Postgres:
 * what it fills in, that it never overwrites, and that a second run writes
 * nothing. Skipped unless PIPELINE_TEST_DATABASE_URL is set; it seeds and
 * deletes its own tenant.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

maybe('backfill-contact-times against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const id = () => randomUUID();
  let unitId = '';
  let adderId = '';
  let ruth = '';
  let bisi = '';

  async function entry(o: { assigneeId?: string | null; createdAt: string; firstContactedAt?: string; assignedAt?: string; source?: 'FIRST_TIMER' | 'ABSENTEE' }) {
    const visitor = await prisma.visitor.create({ data: { id: id(), tenantId, firstName: 'Guest', lastName: 'Test' } });
    return (
      await prisma.followUpEntry.create({
        data: {
          id: id(), tenantId, unitId, sourceType: o.source ?? 'FIRST_TIMER', visitorId: visitor.id, addedById: adderId,
          assigneeId: o.assigneeId ?? null, stage: o.assigneeId ? 'ASSIGNED' : 'UNASSIGNED',
          createdAt: new Date(o.createdAt),
          firstContactedAt: o.firstContactedAt ? new Date(o.firstContactedAt) : null,
          assignedAt: o.assignedAt ? new Date(o.assignedAt) : null,
        },
      })
    ).id;
  }
  async function log(entryId: string, kind: 'CONTACT' | 'QUICK_UPDATE', createdAt: string, contactedAt?: string) {
    await prisma.followUpContactLog.create({
      data: { id: id(), tenantId, entryId, byId: ruth, kind, note: 'Called', createdAt: new Date(createdAt), contactedAt: contactedAt ? new Date(contactedAt) : null },
    });
  }
  async function assignAudit(entryId: string, assigneeId: string, at: string) {
    await prisma.auditLog.create({
      data: { id: id(), tenantId, action: 'ASSIGN', entity: 'FollowUpEntry', entityId: entryId, after: { assigneeId }, createdAt: new Date(at) },
    });
  }
  const row = (entryId: string) => prisma.followUpEntry.findUniqueOrThrow({ where: { id: entryId } });

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Contact times test', slug: `contact-times-${tenantId}` } });
    adderId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
    const member = async (first: string) => {
      const profile = await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } });
      return (await prisma.member.create({ data: { id: id(), tenantId, profileId: profile.id, firstName: first, lastName: 'Test' } })).id;
    };
    [ruth, bisi] = [await member('Ruth'), await member('Bisi')];
    unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow-Up' } })).id;
  });

  afterAll(async () => {
    const where = { tenantId };
    await prisma.followUpContactLog.deleteMany({ where });
    await prisma.auditLog.deleteMany({ where });
    await prisma.followUpEntry.deleteMany({ where });
    await prisma.visitor.deleteMany({ where });
    await prisma.member.deleteMany({ where });
    await prisma.profile.deleteMany({ where });
    await prisma.unit.deleteMany({ where });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('fills first contacts and assignment times once, and never overwrites', async () => {
    // Logged on the 12th about a call on the 10th; a quick update earlier does not count.
    const called = await entry({ assigneeId: ruth, createdAt: '2026-09-01T09:00:00Z' });
    await log(called, 'QUICK_UPDATE', '2026-09-05T09:00:00Z');
    await log(called, 'CONTACT', '2026-09-12T09:00:00Z', '2026-09-10T18:00:00Z');
    await log(called, 'CONTACT', '2026-09-20T09:00:00Z');
    await assignAudit(called, bisi, '2026-09-02T09:00:00Z');
    await assignAudit(called, ruth, '2026-09-03T09:00:00Z');

    const neverCalled = await entry({ assigneeId: bisi, createdAt: '2026-09-04T09:00:00Z' });
    const alreadySet = await entry({ assigneeId: ruth, createdAt: '2026-09-01T09:00:00Z', firstContactedAt: '2026-09-02T09:00:00Z', assignedAt: '2026-09-01T10:00:00Z' });
    await log(alreadySet, 'CONTACT', '2026-08-30T09:00:00Z');
    const absentee = await entry({ assigneeId: null, createdAt: '2026-09-01T09:00:00Z', source: 'ABSENTEE' });
    await log(absentee, 'CONTACT', '2026-09-02T09:00:00Z');

    const plan = await planContactTimes(prisma, tenantId);
    expect(plan.firstContacts.map((r) => r.entryId)).toEqual([called]);
    expect(plan.assignments.map((r) => r.entryId).sort()).toEqual([called, neverCalled].sort());
    expect(await applyContactTimes(prisma, tenantId)).toEqual({ contacted: 1, assigned: 2 });

    expect((await row(called)).firstContactedAt?.toISOString()).toBe('2026-09-10T18:00:00.000Z');
    expect((await row(called)).assignedAt?.toISOString()).toBe('2026-09-03T09:00:00.000Z');
    expect((await row(neverCalled)).firstContactedAt).toBeNull();
    expect((await row(neverCalled)).assignedAt?.toISOString()).toBe('2026-09-04T09:00:00.000Z');
    expect((await row(alreadySet)).firstContactedAt?.toISOString()).toBe('2026-09-02T09:00:00.000Z');
    expect((await row(alreadySet)).assignedAt?.toISOString()).toBe('2026-09-01T10:00:00.000Z');
    expect((await row(absentee)).firstContactedAt).toBeNull();

    expect(await applyContactTimes(prisma, tenantId)).toEqual({ contacted: 0, assigned: 0 });
  });
});
