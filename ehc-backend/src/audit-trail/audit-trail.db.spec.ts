import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { auditTrailQuerySchema } from './audit-trail.schema';
import { AuditTrailService } from './audit-trail.service';

/**
 * Reading the audit trail back, against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL); skipped otherwise. Seeds and deletes its own tenant.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

maybe('AuditTrailService against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const id = () => randomUUID();
  const peter = id();
  const ruth = id();
  const service = new AuditTrailService(prisma as unknown as PrismaService, { get: () => tenantId } as unknown as ConfigService<never, true>);
  const q = (raw: Record<string, unknown> = {}) => auditTrailQuerySchema.parse(raw);
  const at = (iso: string) => new Date(iso);

  function row(actorId: string | null, action: string, entity: string, createdAt: Date, after: object | null, before: object | null = null) {
    return { id: id(), tenantId, actorId, action, entity, entityId: null, createdAt, after: after ?? undefined, before: before ?? undefined };
  }

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Audit trail test', slug: `audit-${tenantId}` } });
    for (const [userId, firstName, lastName] of [[peter, 'Okunola', 'Peter'], [ruth, 'Ruth', 'Ade']]) {
      const profileId = (await prisma.profile.create({ data: { id: id(), userId, tenantId } })).id;
      await prisma.member.create({ data: { id: id(), tenantId, profileId, firstName, lastName } });
    }
    await prisma.auditLog.createMany({
      data: [
        row(peter, 'DELETE', 'Visitor', at('2026-11-17T10:00:01Z'), null, { firstName: 'Ada', email: 'ada@example.com' }),
        row(peter, 'REQUEST', 'visitors', at('2026-11-17T10:00:02Z'), {
          summary: 'Delete a first-timer for good (ADMIN+)', method: 'DELETE', route: '/visitors/:id', targets: [{ kind: 'First-timer', name: 'Ada Eze' }],
        }),
        row(ruth, 'REQUEST', 'units', at('2026-11-18T09:00:00Z'), { summary: 'Create a new unit (ADMIN+)', method: 'POST', body: { name: 'Ushering' } }),
        row(null, 'UPDATE', 'ServiceHeadcount', at('2026-11-16T08:00:00Z'), { total: 300 }),
      ],
    });
  });
  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.member.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('lists what people did, newest first, named, with the record folded into its request', async () => {
    const { items, nextCursor } = await service.list(q());
    expect(nextCursor).toBeNull();
    expect(items.map((i) => [i.summary, i.actorName])).toEqual([
      ['Create a new unit', 'Ruth Ade'],
      ['Delete a first-timer for good', 'Okunola Peter'],
      ['Update: service headcount', null],
    ]);
    expect(items[1].records).toHaveLength(1);
    expect(items[1].records[0].before).toMatchObject({ email: 'ada@example.com' });
  });

  it('pages with a cursor', async () => {
    const first = await service.list(q({ take: 2 }));
    expect(first.items).toHaveLength(2);
    const second = await service.list(q({ take: 2, cursor: first.nextCursor }));
    expect(second.items.map((i) => i.summary)).toEqual(['Update: service headcount']);
  });

  it('filters by person, section, Lagos day and search, including the name of the person who did it', async () => {
    expect((await service.list(q({ actor: ruth }))).items.map((i) => i.summary)).toEqual(['Create a new unit']);
    expect((await service.list(q({ area: 'visitors' }))).items[0].records).toHaveLength(1);
    expect((await service.list(q({ from: '2026-11-17', to: '2026-11-17' }))).items.map((i) => i.summary)).toEqual(['Delete a first-timer for good']);
    expect((await service.list(q({ search: 'ushering' }))).items.map((i) => i.summary)).toEqual(['Create a new unit']);
    expect((await service.list(q({ search: 'okunola peter' }))).items.map((i) => i.summary)).toEqual(['Delete a first-timer for good']);
    expect((await service.list(q({ search: 'ada@example' }))).items.map((i) => i.summary)).toEqual(['Delete a first-timer for good']);
    expect((await service.list(q({ search: '100%' }))).items).toEqual([]);
  });

  it('lists the sections and the people for the filters', async () => {
    const f = await service.filters();
    expect(f.areas).toEqual(['units', 'visitors']);
    expect(f.people).toEqual([
      { userId: peter, name: 'Okunola Peter' },
      { userId: ruth, name: 'Ruth Ade' },
    ]);
  });
});
