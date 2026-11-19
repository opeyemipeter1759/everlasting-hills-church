import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { NavGrantType, PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PageAccessService } from '../auth/page-access/page-access.service';
import type { AuthUser } from '../auth/types/auth-user';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { PreMaritalController } from './pre-marital.controller';
import { PreMaritalService } from './pre-marital.service';
import { validApplication } from './pre-marital.fixture-spec';

/**
 * The whole flow over HTTP, against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL; skipped otherwise), with the real role and
 * page-access guards and the production pipe, filter and envelope. Sign-in is
 * the one stand-in: an `x-test-user` header plays the verified token, and no
 * header on a non-public route is a 401, as JwtAuthGuard does.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000);

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: AuthUser }>();
    const header = req.headers['x-test-user'];
    if (!header) throw new UnauthorizedException();
    req.user = JSON.parse(header) as AuthUser;
    return true;
  }
}

maybe('Pre-marital counselling over HTTP, against Postgres', () => {
  const prisma = url
    ? new PrismaClient({ datasources: { db: { url } } })
    : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const config = {
    get: (k: string) => (k === 'DEFAULT_TENANT_ID' ? tenantId : undefined),
  };
  let app: INestApplication;
  const person = { member: '', pastor: '', admin: '', granted: '' };

  const as = (profileId: string, roles: Role[]) =>
    JSON.stringify({
      userId: randomUUID(),
      email: 'x@example.com',
      role: roles.at(-1),
      effectiveRoles: roles,
      unitLeadOf: [],
      hodOf: [],
      headUsher: false,
      profileId,
      memberId: null,
      tenantId,
    });
  const http = () => request(app.getHttpServer());
  const submit = (body: object) =>
    http().post('/pre-marital-counselling').send(body);

  beforeAll(async () => {
    await prisma.tenant.create({
      data: { id: tenantId, name: 'Pre-marital test', slug: `pmc-${tenantId}` },
    });
    for (const key of Object.keys(person) as (keyof typeof person)[]) {
      person[key] = (
        await prisma.profile.create({
          data: { id: randomUUID(), userId: randomUUID(), tenantId },
        })
      ).id;
    }
    // A Super Admin gave one ordinary member the page on the Permissions screen.
    await prisma.navPermissionGrant.create({
      data: {
        id: randomUUID(),
        tenantId,
        itemHref: '/dashboard/pastor/pre-marital-counselling',
        type: NavGrantType.MEMBER,
        targetId: person.granted,
      },
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [PreMaritalController],
      providers: [
        PreMaritalService,
        PageAccessService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: APP_GUARD, useClass: TestAuthGuard },
        { provide: APP_GUARD, useClass: PageAccessGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma.preMaritalApplication.deleteMany({ where: { tenantId } });
    await prisma.navPermissionGrant.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('refuses an invalid application with an error for each field, and saves nothing', async () => {
    const res = await submit({
      ...validApplication(),
      submissionKey: randomUUID(),
      groomFirstName: '',
      brideEmail: 'nope',
      consent: false,
    }).expect(400);
    const details = res.body.error.details as {
      path: string;
      message: string;
    }[];
    expect(Object.fromEntries(details.map((d) => [d.path, d.message]))).toEqual(
      {
        groomFirstName: "Enter the groom's first name",
        brideEmail: 'Enter a valid email address',
        consent: 'Both of you need to agree to apply',
      },
    );
    expect(
      await prisma.preMaritalApplication.count({ where: { tenantId } }),
    ).toBe(0);
  });

  it('saves an application once, however many times it is sent, starting as New', async () => {
    const body = { ...validApplication(), submissionKey: randomUUID() };
    const [a, b, c] = await Promise.all([
      submit(body),
      submit(body),
      submit(body),
    ]);
    for (const res of [a, b, c]) expect(res.status).toBe(201);
    expect(new Set([a, b, c].map((r) => r.body.data.referenceCode)).size).toBe(
      1,
    );
    expect(Object.keys(a.body.data).sort()).toEqual([
      'referenceCode',
      'submittedAt',
    ]);

    const rows = await prisma.preMaritalApplication.findMany({
      where: { tenantId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: 'NEW',
      groomFirstName: 'Tunde',
      brideFirstName: 'Ada',
      groomEmail: 'tunde@example.com',
    });
  });

  it('keeps applications from anyone who is not pastoral, even calling the API directly', async () => {
    const id = (
      await prisma.preMaritalApplication.findFirstOrThrow({
        where: { tenantId },
      })
    ).id;
    await http().get('/pre-marital-counselling/applications').expect(401);
    await http().get(`/pre-marital-counselling/applications/${id}`).expect(401);
    await http()
      .patch(`/pre-marital-counselling/applications/${id}/status`)
      .send({ status: 'CLOSED' })
      .expect(401);
    for (const [profile, roles] of [
      [person.member, [Role.MEMBER]],
      [person.admin, [Role.MEMBER, Role.ADMIN_HEAD]],
    ] as const) {
      const header = as(profile, [...roles]);
      await http()
        .get('/pre-marital-counselling/applications')
        .set('x-test-user', header)
        .expect(403);
      await http()
        .get(`/pre-marital-counselling/applications/${id}`)
        .set('x-test-user', header)
        .expect(403);
      await http()
        .patch(`/pre-marital-counselling/applications/${id}/status`)
        .set('x-test-user', header)
        .send({ status: 'CLOSED' })
        .expect(403);
    }
    expect(
      (await prisma.preMaritalApplication.findUniqueOrThrow({ where: { id } }))
        .status,
    ).toBe('NEW');
  });

  it('a pastor finds it in the list, opens it in full and moves it through review', async () => {
    const pastor = as(person.pastor, [Role.MEMBER, Role.PASTOR]);
    const list = await http()
      .get('/pre-marital-counselling/applications')
      .set('x-test-user', pastor)
      .expect(200);
    expect(list.body.data.counts).toEqual({ NEW: 1, IN_REVIEW: 0, CLOSED: 0 });
    const [item] = list.body.data.items;
    expect(item).toMatchObject({
      groomFirstName: 'Tunde',
      groomLastName: 'Adeyemi',
      brideFirstName: 'Ada',
      brideLastName: 'Eze',
      status: 'NEW',
    });
    expect(item).not.toHaveProperty('groomEmail');

    const full = await http()
      .get(`/pre-marital-counselling/applications/${item.id}`)
      .set('x-test-user', pastor)
      .expect(200);
    expect(full.body.data).toMatchObject({
      groomPhone: '0803 123 4567',
      brideEmail: 'ada@example.com',
      message: 'We hope to marry next year.',
      relationshipLength: '1_TO_2_YEARS',
    });
    expect(full.body.data).not.toHaveProperty('submissionKey');

    const moved = await http()
      .patch(`/pre-marital-counselling/applications/${item.id}/status`)
      .set('x-test-user', pastor)
      .send({ status: 'IN_REVIEW' })
      .expect(200);
    expect(moved.body.data).toMatchObject({
      status: 'IN_REVIEW',
      statusUpdatedById: person.pastor,
    });
    await http()
      .patch(`/pre-marital-counselling/applications/${item.id}/status`)
      .set('x-test-user', pastor)
      .send({ status: 'DONE' })
      .expect(400);

    const inReview = await http()
      .get('/pre-marital-counselling/applications?status=IN_REVIEW')
      .set('x-test-user', pastor)
      .expect(200);
    expect(inReview.body.data.items.map((i: { id: string }) => i.id)).toEqual([
      item.id,
    ]);
    await http()
      .get('/pre-marital-counselling/applications/not-there')
      .set('x-test-user', pastor)
      .expect(404);
  });

  it('someone a Super Admin gave the page to can work it like a pastor', async () => {
    const granted = as(person.granted, [Role.MEMBER]);
    const list = await http()
      .get('/pre-marital-counselling/applications')
      .set('x-test-user', granted)
      .expect(200);
    const id = list.body.data.items[0].id;
    await http()
      .patch(`/pre-marital-counselling/applications/${id}/status`)
      .set('x-test-user', granted)
      .send({ status: 'CLOSED' })
      .expect(200);
  });
});
