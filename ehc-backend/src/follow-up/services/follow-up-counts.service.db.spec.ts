import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { PIPELINE_STATUSES } from '../../pipeline/pipeline.types';
import { FollowUpCountsService } from './follow-up-counts.service';
import { FollowUpNoteActivityService } from './follow-up-note-activity.service';

/**
 * Every figure on the Follow Up page equals the list it opens and the sum of
 * the counts beside it, checked against the real pipeline SQL. Runs on a
 * disposable Postgres (PIPELINE_TEST_DATABASE_URL); skipped otherwise. Seeds a
 * tenant of its own and deletes it afterwards.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
// A real database, on a laptop often busy with other work: allow it time.
jest.setTimeout(60_000);

maybe('Follow Up counts against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const config = { get: () => tenantId } as never;
  const pipeline = new PipelineRepository(prisma as never, config);
  const service = new FollowUpCountsService(pipeline, new FollowUpNoteActivityService(prisma as never, config), prisma as never, config);
  const id = () => randomUUID();
  const now = new Date('2026-11-16T09:00:00Z');
  let me: string;
  let profileId: string;

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Counts test', slug: `counts-${tenantId}` } });
    profileId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
    me = (await prisma.member.create({ data: { id: id(), tenantId, profileId, firstName: 'Me', lastName: 'Test' } })).id;
    const unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow-Up' } })).id;

    const people: [string, string, string | null, string | null][] = [
      // name, first visit, stage, assignee
      ['New-one', '2026-11-15', null, null],
      ['New-two', '2026-11-12', 'ASSIGNED', 'me'],
      ['Old-one', '2026-06-07', 'ASSIGNED', 'me'],
      ['Old-two', '2026-05-03', 'UNASSIGNED', null],
      ['Settled', '2026-02-01', 'CONFIRMED', 'me'],
      ['Out', '2026-03-01', 'OPTED_OUT', null],
      ['Archived', '2026-11-15', 'ASSIGNED', 'me'],
    ];
    for (const [first, day, stage, assignee] of people) {
      const v = await prisma.visitor.create({
        data: {
          id: id(), tenantId, firstName: first, lastName: 'Test', submittedAt: new Date(`${day}T09:00:00Z`),
          firstVisitDate: new Date(`${day}T00:00:00Z`), ...(first === 'Archived' ? { archivedAt: now } : {}),
        },
      });
      if (stage) {
        await prisma.followUpEntry.create({
          data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId: v.id, addedById: profileId, stage: stage as never, assigneeId: assignee ? me : null },
        });
      }
      if (first === 'Old-one') {
        await prisma.followUpNote.create({
          data: { id: id(), tenantId, subjectKind: 'VISITOR', subjectId: v.id, authorId: profileId, body: 'Called', createdAt: new Date('2026-11-14T10:00:00Z') },
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.followUpNote.deleteMany({ where: { tenantId } });
    await prisma.followUpEntry.deleteMany({ where: { tenantId } });
    await prisma.visitor.deleteMany({ where: { tenantId } });
    await prisma.member.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.unit.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('makes every displayed total equal its list and the sum of the counts beside it', async () => {
    const counts = await service.summary({ memberId: me } as never, now);
    const everyone = await pipeline.list({ take: 200 });
    const mine = await pipeline.list({ assigneeId: me, take: 200 });

    expect(counts.total).toBe(everyone.rows.length);
    expect(counts.total).toBe(PIPELINE_STATUSES.reduce((n, s) => n + counts.byStatus[s], 0));
    expect(counts.visitors).toBe(counts.total);
    expect(counts.assignedToMe).toBe(mine.rows.length);
    for (const status of PIPELINE_STATUSES) {
      const list = await pipeline.list({ status, take: 200 });
      expect(list.rows.length).toBe(counts.byStatus[status]);
    }
    // The archived form is in none of it.
    expect(everyone.rows.map((r) => r.firstName)).not.toContain('Archived');
    expect(counts.total).toBe(6);
  });

  it('states who is new, who nobody carries, and who has gone quiet', async () => {
    const counts = await service.summary({ memberId: me } as never, now);
    expect(counts.followingUp).toBe(4);
    expect(counts.followUp).toEqual({ newThisWeek: 2, unassigned: 2, quiet: 3 });
  });
});
