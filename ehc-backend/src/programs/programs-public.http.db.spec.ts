import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { IcsBuilderService } from '../calendar/services/ics-builder.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { seedPrograms } from './programs.seed';
import { ProgramsPublicController } from './programs-public.controller';
import { ProgramsPublicService } from './programs-public.service';

/**
 * The public Programs API over HTTP against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL; skipped otherwise). Scripture text comes from
 * the Bible tables; this spec adds the few verses it needs if they are missing.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

maybe('Public programs API against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const otherTenant = randomUUID();
  const cleanup: (() => Promise<unknown>)[] = [];
  let app: INestApplication;
  let service: ProgramsPublicService;
  let translationCode = '';
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    for (const t of [tenantId, otherTenant]) await prisma.tenant.create({ data: { id: t, name: 'Programs public test', slug: `progpub-${t}` } });
    await seedPrograms(prisma, tenantId);
    await prisma.program.update({ where: { tenantId_slug: { tenantId, slug: 'endyo' } }, data: { status: 'DRAFT' } });
    await prisma.program.create({ data: { id: randomUUID(), tenantId: otherTenant, slug: 'other-church', name: 'Another church', shortDescription: 'x', status: 'PUBLISHED' } });

    // Isaiah 62:6-7 in the default translation.
    let translation = await prisma.bibleTranslation.findFirst({ where: { isDefault: true } });
    if (!translation) {
      translation = await prisma.bibleTranslation.create({ data: { code: `T${randomUUID().slice(0, 6)}`, name: 'Test', licence: 'public-domain', isDefault: true } });
      const id = translation.id;
      cleanup.push(() => prisma.bibleTranslation.delete({ where: { id } }));
    }
    translationCode = translation.code;
    for (const [id, osisCode, name, chapterCount] of [[23, 'Isa', 'Isaiah', 66], [1, 'Gen', 'Genesis', 50]] as const) {
      if (!(await prisma.bibleBook.findUnique({ where: { id } }))) {
        await prisma.bibleBook.create({ data: { id, osisCode, name, shortName: osisCode, testament: 'OT', chapterCount } });
        cleanup.push(() => prisma.bibleBook.delete({ where: { id } }));
      }
    }
    for (const [verse, text] of [[6, 'I have set watchmen on your walls.'], [7, 'And give him no rest.']] as const) {
      const verseId = 23062000 + verse;
      const key = { translationId_verseId: { translationId: translation.id, verseId } };
      if (!(await prisma.bibleVerse.findUnique({ where: key }))) {
        await prisma.bibleVerse.create({ data: { translationId: translation.id, verseId, bookId: 23, chapter: 62, verse, text, wordCount: 6 } });
        cleanup.push(() => prisma.bibleVerse.delete({ where: key }));
      }
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [ProgramsPublicController],
      providers: [
        ProgramsPublicService,
        IcsBuilderService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'DEFAULT_TENANT_ID' ? tenantId : undefined) } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
    service = moduleRef.get(ProgramsPublicService);
  });

  afterAll(async () => {
    await app?.close();
    await prisma.program.deleteMany({ where: { tenantId: { in: [tenantId, otherTenant] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenant] } } });
    for (const undo of cleanup.reverse()) await undo();
    await prisma.$disconnect();
  });

  it("lists this church's published programs in order, never a draft or another church's", async () => {
    const res = await http().get('/public/programs').expect(200);
    const items = res.body.data as { slug: string }[];
    expect(items.map((p) => p.slug)).toEqual(['prayer-watch', 'dew-of-heaven', 'furnace', 'homecoming-conference']);
    expect(res.headers['cache-control']).toContain('max-age=60');
  });

  it('gives each card its schedule, eyebrow, next occurrence and scripture text', async () => {
    const items = (await http().get('/public/programs').expect(200)).body.data;
    const watch = items.find((p: { slug: string }) => p.slug === 'prayer-watch');
    expect(watch.eyebrow).toBe('WEEKLY WATCH · MON TUE THU FRI SAT');
    expect(watch.schedule).toBe('Every Monday, Tuesday, Thursday, Friday and Saturday night, 10:00 PM to 6:00 AM WAT');
    expect(new Date(watch.nextOccurrence.end).getTime()).toBeGreaterThan(Date.now());
    expect(watch.scriptures[0]).toMatchObject({ reference: 'Isaiah 62:6-7', translation: translationCode, status: 'CONFIRMED' });
    expect(watch.scriptures[0].text).toContain('watchmen');
    const homecoming = items.find((p: { slug: string }) => p.slug === 'homecoming-conference');
    expect(homecoming).toMatchObject({ nameStatus: 'PROVISIONAL', nextOccurrence: null, isLiveNow: false, schedule: 'April. Date to be announced', scriptures: [] });
  });

  it('says which watch is on now: at 1 AM on a Tuesday, The Watch-House', async () => {
    const items = await service.list(new Date('2026-11-24T00:00:00Z'));
    const watch = items.find((p) => p.slug === 'prayer-watch')!;
    expect(watch).toMatchObject({ isLiveNow: true, liveSession: 'The Watch-House' });
    expect(watch.occurrences[0].sessions.map((s) => s.name)).toEqual(['The Seers', 'The Watch-House', 'The Threshers', 'The Gatekeepers']);
  });

  it('shows a program page with its watches, story and editions split into upcoming and archive', async () => {
    const watch = (await http().get('/public/programs/prayer-watch').expect(200)).body.data;
    expect(watch.sessions).toHaveLength(4);
    expect(watch.longDescription).toContain('prophetic words');
    const furnace = await service.detail('furnace', new Date('2026-11-24T12:00:00Z'));
    expect(furnace.editions.archive.map((e) => [e.label, e.theme])).toEqual([["Furnace '26", 'Dominion']]);
    expect(furnace.editions.upcoming.map((e) => [e.label, e.dateStatus])).toEqual([["Furnace '27", 'TBA']]);
  });

  it('gives the page its anchor verse, Genesis 49:26, from the Bible tables', async () => {
    const res = await http().get('/public/programs/anchor').expect(200);
    expect(res.body.data).toMatchObject({ reference: 'Genesis 49:26', status: 'CONFIRMED' });
  });

  it('answers 404 for a draft and for another church\'s program', async () => {
    await http().get('/public/programs/endyo').expect(404);
    await http().get('/public/programs/other-church').expect(404);
  });

  it('offers a calendar file for confirmed dates only', async () => {
    const ics = await http().get('/public/programs/prayer-watch/calendar.ics').expect(200);
    expect(ics.headers['content-type']).toContain('text/calendar');
    expect(ics.text).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA');
    expect(ics.text).toContain('TZID=Africa/Lagos');
    await http().get('/public/programs/homecoming-conference/calendar.ics').expect(404);
  });
});
