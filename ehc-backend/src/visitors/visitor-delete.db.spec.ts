import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { deleteVisitor } from './visitor-delete';

/**
 * Deleting a first-timer for good, against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL); skipped otherwise. Seeds and deletes its own tenant.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

maybe('deleteVisitor against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const id = () => randomUUID();

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Delete test', slug: `delete-${tenantId}` } });
  });
  afterAll(async () => {
    const where = { tenantId };
    for (const table of ['auditLog', 'formSubmission', 'messageLog', 'followUpNote', 'followUpEntry', 'firstTimerVisit', 'visitor', 'member', 'profile', 'unit'] as const) {
      await (prisma[table] as unknown as { deleteMany: (a: unknown) => Promise<unknown> }).deleteMany({ where });
    }
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('removes them and everything that hangs off them, keeps others, and leaves a copy without the prayer request in the audit trail', async () => {
    const submittedAt = new Date('2026-11-15T09:00:00Z');
    const profileId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
    const memberId = (await prisma.member.create({ data: { id: id(), tenantId, profileId, firstName: 'Ruth', lastName: 'Staff' } })).id;
    const unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow-Up' } })).id;
    const ada = await prisma.visitor.create({
      data: { id: id(), tenantId, firstName: 'Ada', lastName: 'Eze', phone: '2348031234567', email: 'ada@example.com', prayerPoint: 'PRIVATE-PRAYER', submittedAt },
    });
    const keep = await prisma.visitor.create({ data: { id: id(), tenantId, firstName: 'Bola', lastName: 'Ade', possibleReturnVisitorId: ada.id, submittedAt } });
    const entry = await prisma.followUpEntry.create({ data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId: ada.id, addedById: profileId, assigneeId: memberId } });
    await prisma.followUpContactLog.create({ data: { id: id(), tenantId, entryId: entry.id, byId: memberId, note: 'Called' } });
    await prisma.followUpNote.create({ data: { id: id(), tenantId, subjectKind: 'VISITOR', subjectId: ada.id, authorId: memberId, body: 'Spoke to her' } as never });
    await prisma.firstTimerVisit.create({ data: { id: id(), tenantId, visitorId: ada.id, visitedOn: new Date('2026-11-15T00:00:00Z'), source: 'FORM' } });
    await prisma.messageLog.create({ data: { id: id(), tenantId, visitorId: ada.id, channel: 'whatsapp', templateKey: 'first_timer.opening', templateVersion: 1, status: 'SENT' } });
    await prisma.formSubmission.create({ data: { id: id(), tenantId, type: 'first_timer', submittedAt, data: { first_name: 'Ada', phone_number: '0803 123 4567' } } });
    const other = await prisma.formSubmission.create({ data: { id: id(), tenantId, type: 'first_timer', submittedAt, data: { first_name: 'Bola', phone_number: '0809 999 0000' } } });

    const result = await prisma.$transaction((tx) => deleteVisitor(tx, tenantId, ada.id, 'actor-user'));
    expect(result?.removed).toEqual({ followUpRecords: 1, notes: 1, visits: 1, messages: 1, formSubmissions: 1 });

    expect(await prisma.visitor.findUnique({ where: { id: ada.id } })).toBeNull();
    expect(await prisma.followUpEntry.count({ where: { visitorId: ada.id } })).toBe(0);
    expect(await prisma.followUpContactLog.count({ where: { entryId: entry.id } })).toBe(0);
    expect(await prisma.firstTimerVisit.count({ where: { visitorId: ada.id } })).toBe(0);
    expect(await prisma.formSubmission.findUnique({ where: { id: other.id } })).not.toBeNull();
    expect((await prisma.visitor.findUniqueOrThrow({ where: { id: keep.id } })).possibleReturnVisitorId).toBeNull();

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { tenantId, entity: 'Visitor', entityId: ada.id } });
    expect(audit).toMatchObject({ action: 'DELETE', actorId: 'actor-user' });
    expect(JSON.stringify(audit.before)).toContain('ada@example.com');
    expect(JSON.stringify(audit.before)).not.toContain('PRIVATE-PRAYER');
    expect(await prisma.$transaction((tx) => deleteVisitor(tx, tenantId, ada.id, 'actor-user'))).toBeNull();
  });
});
