import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PROGRAM_SEED, seedPrograms } from './programs.seed';

/**
 * Programs schema against a disposable Postgres (PIPELINE_TEST_DATABASE_URL;
 * skipped otherwise): the seed, tenant separation, the database checks, and
 * the row level security policy that lets Supabase's anon role read
 * published programs only.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

/** The policy block of the migration, run on its own (one statement). */
function policyBlock(): string {
  const sql = readFileSync(join(__dirname, '../../prisma/sql/programs/001_programs.sql'), 'utf8');
  const start = sql.indexOf("DO $$ BEGIN\n  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')");
  const end = sql.indexOf('END $$;', start) + 'END $$;'.length;
  if (start < 0) throw new Error('policy block not found');
  return sql.slice(start, end);
}

maybe('Programs schema against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantA = randomUUID();
  const tenantB = randomUUID();

  beforeAll(async () => {
    for (const t of [tenantA, tenantB]) await prisma.tenant.create({ data: { id: t, name: 'Programs test', slug: `prog-${t}` } });
  });

  afterAll(async () => {
    await prisma.program.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
    await prisma.$disconnect();
  });

  it('seeds the five programs with their scriptures, watches and editions', async () => {
    expect(await seedPrograms(prisma, tenantA)).toEqual(PROGRAM_SEED.map((p) => p.slug));
    const programs = await prisma.program.findMany({
      where: { tenantId: tenantA },
      include: { Scriptures: true, Sessions: true, Editions: true },
      orderBy: { sortOrder: 'asc' },
    });
    expect(programs.map((p) => p.slug)).toEqual(['prayer-watch', 'dew-of-heaven', 'furnace', 'homecoming-conference', 'endyo']);
    const watch = programs[0];
    expect(watch).toMatchObject({ recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA', startTime: '22:00', durationMinutes: 480, timezone: 'Africa/Lagos', ctaUrl: '/prayer-watch' });
    expect(watch.Sessions.map((s) => s.name).sort()).toEqual(['The Gatekeepers', 'The Seers', 'The Threshers', 'The Watch-House']);
    expect(programs[3]).toMatchObject({ nameStatus: 'PROVISIONAL', dateStatus: 'TBA', startOffsetDays: -1 });
    expect(programs[3].Scriptures).toHaveLength(0);
    expect(programs[4].Scriptures[0]).toMatchObject({ bookId: 42, chapter: 24, verseStart: 49, scriptureStatus: 'SUGGESTED' });
    expect(programs[2].Editions.map((e) => e.label).sort()).toEqual(["Furnace '26", "Furnace '27"]);
    for (const p of programs) expect(`${p.shortDescription}${p.longDescription}`).not.toMatch(/—/);
  });

  it('runs again without duplicating anything or undoing an edit', async () => {
    await prisma.program.update({ where: { tenantId_slug: { tenantId: tenantA, slug: 'endyo' } }, data: { name: 'Endyo Night' } });
    expect(await seedPrograms(prisma, tenantA)).toEqual([]);
    expect(await prisma.program.count({ where: { tenantId: tenantA } })).toBe(5);
    expect((await prisma.program.findUniqueOrThrow({ where: { tenantId_slug: { tenantId: tenantA, slug: 'endyo' } } })).name).toBe('Endyo Night');
  });

  it("keeps each church's programs apart: the same slug can exist once per tenant", async () => {
    expect(await prisma.program.count({ where: { tenantId: tenantB } })).toBe(0);
    await seedPrograms(prisma, tenantB);
    const a = await prisma.program.findUniqueOrThrow({ where: { tenantId_slug: { tenantId: tenantA, slug: 'furnace' } } });
    const b = await prisma.program.findUniqueOrThrow({ where: { tenantId_slug: { tenantId: tenantB, slug: 'furnace' } } });
    expect(a.id).not.toBe(b.id);
    await expect(
      prisma.program.create({ data: { id: randomUUID(), tenantId: tenantA, slug: 'furnace', name: 'Copy', shortDescription: 'x' } }),
    ).rejects.toThrow();
  });

  it('refuses a malformed slug, start time or duration at the database', async () => {
    const base = { tenantId: tenantA, name: 'Bad', shortDescription: 'x' };
    await expect(prisma.program.create({ data: { ...base, id: randomUUID(), slug: 'Bad Slug' } })).rejects.toThrow();
    await expect(prisma.program.create({ data: { ...base, id: randomUUID(), slug: 'bad-time', startTime: '25:00' } })).rejects.toThrow();
    await expect(prisma.program.create({ data: { ...base, id: randomUUID(), slug: 'bad-length', durationMinutes: 0 } })).rejects.toThrow();
  });

  it("lets Supabase's anon role read published programs and their parts only", async () => {
    // A plain Postgres test database has no Supabase roles; create them, then install the policy.
    await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await prisma.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO anon, authenticated');
    await prisma.$executeRawUnsafe(policyBlock());
    await prisma.program.update({ where: { tenantId_slug: { tenantId: tenantA, slug: 'prayer-watch' } }, data: { status: 'DRAFT' } });

    const asAnon = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE anon');
      const programs = await tx.$queryRawUnsafe<{ slug: string }[]>(`SELECT "slug" FROM "Program" WHERE "tenantId" = $1 ORDER BY "sortOrder"`, tenantA);
      const sessions = await tx.$queryRawUnsafe<{ n: number }[]>(
        `SELECT count(*)::int AS n FROM "ProgramSession" s JOIN "Program" p ON p."id" = s."programId" WHERE p."tenantId" = $1`,
        tenantA,
      );
      return { programs: programs.map((p) => p.slug), sessions: sessions[0].n };
    });
    expect(asAnon.programs).toEqual(['dew-of-heaven', 'furnace', 'homecoming-conference', 'endyo']);
    // The only program with sessions (the watches) is now a draft.
    expect(asAnon.sessions).toBe(0);
    await prisma.program.update({ where: { tenantId_slug: { tenantId: tenantA, slug: 'prayer-watch' } }, data: { status: 'PUBLISHED' } });
  });
});
