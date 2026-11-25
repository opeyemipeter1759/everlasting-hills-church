import { CanActivate, ExecutionContext, INestApplication, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { CmsRevalidateService } from '../cms/services/cms-revalidate.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { seedPrograms } from './programs.seed';
import { ProgramsAdminController } from './programs-admin.controller';
import { ProgramsAdminService } from './programs-admin.service';

/**
 * The Programs manager over HTTP against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL; skipped otherwise), with the real RolesGuard.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string>; user?: AuthUser }>();
    if (!req.headers['x-test-user']) throw new UnauthorizedException();
    req.user = JSON.parse(req.headers['x-test-user']) as AuthUser;
    return true;
  }
}

maybe('Programs manager API against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const otherTenant = randomUUID();
  const revalidate = { trigger: jest.fn() };
  let app: INestApplication;
  let foreignId = '';

  const user = (role: Role) =>
    JSON.stringify({ userId: randomUUID(), email: 'x@example.com', role, effectiveRoles: role === Role.VISITOR ? [Role.VISITOR] : [Role.MEMBER, role], unitLeadOf: [], hodOf: [], headUsher: false, profileId: randomUUID(), memberId: null, tenantId });
  const as = (role: Role) => {
    const h = user(role);
    const r = () => request(app.getHttpServer());
    return {
      get: (p: string) => r().get(p).set('x-test-user', h),
      post: (p: string, b: object = {}) => r().post(p).set('x-test-user', h).send(b),
      patch: (p: string, b: object) => r().patch(p).set('x-test-user', h).send(b),
      put: (p: string, b: object) => r().put(p).set('x-test-user', h).send(b),
      del: (p: string) => r().delete(p).set('x-test-user', h),
    };
  };
  const admin = () => as(Role.ADMIN);
  const idOf = async (slug: string) => (await prisma.program.findUniqueOrThrow({ where: { tenantId_slug: { tenantId, slug } } })).id;

  beforeAll(async () => {
    for (const t of [tenantId, otherTenant]) await prisma.tenant.create({ data: { id: t, name: 'Programs admin test', slug: `progadm-${t}` } });
    await seedPrograms(prisma, tenantId);
    foreignId = randomUUID();
    await prisma.program.create({ data: { id: foreignId, tenantId: otherTenant, slug: 'theirs', name: 'Theirs', shortDescription: 'x' } });
    const moduleRef = await Test.createTestingModule({
      controllers: [ProgramsAdminController],
      providers: [
        ProgramsAdminService,
        { provide: CmsRevalidateService, useValue: revalidate },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'DEFAULT_TENANT_ID' ? tenantId : undefined) } },
        { provide: APP_GUARD, useClass: TestAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma.auditLog.deleteMany({ where: { tenantId } }).catch(() => undefined);
    await prisma.program.deleteMany({ where: { tenantId: { in: [tenantId, otherTenant] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenant] } } });
    await prisma.$disconnect();
  });

  it.each([
    [Role.SUPER_ADMIN, 200],
    [Role.PASTOR, 200],
    [Role.ADMIN, 200],
    [Role.UNIT_LEAD, 403],
    [Role.MEMBER, 403],
    [Role.VISITOR, 403],
  ])('lets %s %s', async (role, status) => {
    await as(role).get('/programs').expect(status);
    const create = await as(role).post('/programs', { name: `By ${role}`, shortDescription: 'A test program' });
    expect(create.status).toBe(status === 200 ? 201 : 403);
  });

  it("lists this church's programs only, in order, with what needs attention", async () => {
    const items = (await admin().get('/programs').expect(200)).body.data as { slug: string; attention: string[] }[];
    expect(items.slice(0, 5).map((p) => p.slug)).toEqual(['prayer-watch', 'dew-of-heaven', 'furnace', 'homecoming-conference', 'endyo']);
    expect(items.some((p) => p.slug === 'theirs')).toBe(false);
    expect(items.find((p) => p.slug === 'homecoming-conference')!.attention).toEqual(['Date to be announced', 'Name not final']);
    expect(items.find((p) => p.slug === 'endyo')!.attention).toEqual(['Date to be announced', 'Scripture needs confirmation']);
    await admin().get(`/programs/${foreignId}`).expect(404);
  });

  it('changes only the fields a PATCH sends: everything left out keeps its value', async () => {
    const id = await idOf('prayer-watch');
    const before = (await admin().get(`/programs/${id}`).expect(200)).body.data;
    await admin().patch(`/programs/${id}`, { name: 'The Prayer Watch' }).expect(200);
    const after = (await admin().get(`/programs/${id}`).expect(200)).body.data;
    expect(after.name).toBe('The Prayer Watch');
    for (const k of ['featured', 'ctaLabel', 'ctaUrl', 'startTime', 'durationMinutes', 'recurrenceRule', 'accent', 'format', 'dateStatus', 'cadence', 'programType', 'longDescription', 'status', 'nameStatus', 'timezone', 'startOffsetDays'])
      expect([k, after[k]]).toEqual([k, before[k]]);
    expect(after.sessions).toHaveLength(4);
    await admin().patch(`/programs/${id}`, {}).expect(400);
    await admin().patch(`/programs/${id}`, { recurrenceRule: 'FREQ=DAILY;INTERVAL=3' }).expect(400);
  });

  it('cleans the long description, refuses unsafe links, and keeps slugs unique', async () => {
    const id = await idOf('furnace');
    const res = await admin().patch(`/programs/${id}`, { longDescription: '<p onclick="x()">Fire <script>alert(1)</script><a href="javascript:alert(1)">here</a></p>' }).expect(200);
    expect(res.body.data.longDescription).toBe('<p>Fire <a>here</a></p>');
    await admin().patch(`/programs/${id}`, { streamUrl: 'http://insecure.example' }).expect(400);
    await admin().patch(`/programs/${id}`, { slug: 'prayer-watch' }).expect(409);
  });

  it('publishes, unpublishes and archives with an audit row, and refreshes the public pages each time', async () => {
    const id = (await admin().post('/programs', { name: 'Midweek Fire', shortDescription: 'A new one' }).expect(201)).body.data.id as string;
    revalidate.trigger.mockClear();
    expect((await admin().post(`/programs/${id}/publish`).expect(200)).body.data.status).toBe('PUBLISHED');
    expect((await admin().post(`/programs/${id}/archive`).expect(200)).body.data.status).toBe('ARCHIVED');
    expect(revalidate.trigger).toHaveBeenCalledWith(['programs', `programs:${tenantId}`], ['/programs']);
    expect(await prisma.auditLog.count({ where: { tenantId, entity: 'Program', entityId: id, action: { in: ['PUBLISH', 'ARCHIVE'] } } })).toBe(2);
    await admin().post(`/programs/${id}/publish`).expect(200);
    await admin().del(`/programs/${id}`).expect(409);
    await admin().post(`/programs/${id}/unpublish`).expect(200);
    await admin().del(`/programs/${id}`).expect(200);
    expect(await prisma.auditLog.count({ where: { tenantId, entityId: id, action: 'DELETE' } })).toBe(1);
  });

  it('reorders by id, refusing an id from another church', async () => {
    const items = (await admin().get('/programs').expect(200)).body.data as { id: string; slug: string }[];
    const ids = items.map((p) => p.id).reverse();
    const res = await admin().patch('/programs/order', { ids }).expect(200);
    expect((res.body.data as { id: string }[]).map((p) => p.id)).toEqual(ids);
    await admin().patch('/programs/order', { ids: [...ids, foreignId] }).expect(404);
  });

  it('replaces scriptures (checked against the Bible), sessions and editions', async () => {
    const id = await idOf('endyo');
    await admin().put(`/programs/${id}/scriptures`, { scriptures: [{ reference: 'Hezekiah 3:1' }] }).expect(400);
    const books = await prisma.bibleBook.count();
    if (books > 0) {
      const res = await admin().put(`/programs/${id}/scriptures`, { scriptures: [{ reference: 'Luke 24:49', status: 'CONFIRMED' }] }).expect(200);
      expect(res.body.data.scriptures[0]).toMatchObject({ reference: 'Luke 24:49', status: 'CONFIRMED' });
    }
    const sessions = await admin().put(`/programs/${id}/sessions`, { sessions: [{ name: 'Word', startTime: '18:00', endTime: '19:30' }, { name: 'Prayer', startTime: '19:30', endTime: '21:00' }] }).expect(200);
    expect(sessions.body.data.sessions.map((s: { name: string }) => s.name)).toEqual(['Word', 'Prayer']);
    await admin().put(`/programs/${id}/editions`, { editions: [{ label: 'Endyo 1', dateStatus: 'CONFIRMED' }] }).expect(400);
    const editions = await admin().put(`/programs/${id}/editions`, { editions: [{ label: 'Endyo 1', dateStatus: 'CONFIRMED', startsOn: '2027-01-08', endsOn: '2027-01-09' }] }).expect(200);
    expect(editions.body.data.editions[0]).toMatchObject({ label: 'Endyo 1', startsOn: '2027-01-08', endsOn: '2027-01-09' });
  });

  it('previews a schedule being edited: the words, the eyebrow and the next three dates', async () => {
    const res = await admin().post('/programs/schedule-preview', { cadence: 'WEEKLY', programType: 'PRAYER', recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA', startTime: '22:00', durationMinutes: 480, dateStatus: 'CONFIRMED' }).expect(200);
    expect(res.body.data.schedule).toBe('Every Monday, Tuesday, Thursday, Friday and Saturday night, 10:00 PM to 6:00 AM WAT');
    expect(res.body.data.next).toHaveLength(3);
    const tba = await admin().post('/programs/schedule-preview', { cadence: 'ANNUAL', programType: 'CONFERENCE', recurrenceRule: 'FREQ=YEARLY;BYMONTH=4;BYDAY=-1SA', dateStatus: 'TBA' }).expect(200);
    expect(tba.body.data).toMatchObject({ schedule: 'April. Date to be announced', next: [] });
  });
});
