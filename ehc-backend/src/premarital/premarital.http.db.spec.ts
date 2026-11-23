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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess } from './case-access';
import { CaseActionsService } from './case-actions.service';
import { CaseDeleteService } from './case-delete.service';
import { CaseReadsService } from './case-reads.service';
import { CounsellingNotifier } from './counselling-notifier';
import { CoupleAccountsService } from './couple/couple-accounts.service';
import { DocumentDispatchService } from './documents/document-dispatch.service';
import { DocumentsConfigService } from './documents/documents-config';
import { PolicyService } from './policy';
import { PremaritalController } from './premarital.controller';
import { validApplication } from './premarital.fixture-spec';
import { PublicApplicationsService } from './public-applications.service';
import { PublicPremaritalController } from './public-premarital.controller';
import { PremaritalSessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

/**
 * Pre-marital counselling over HTTP against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL; skipped otherwise), with the real role guard,
 * rate limiter, pipe, filter and envelope. Sign-in is the one stand-in: an
 * `x-test-user` header plays the verified token; no header is a 401.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(180_000);

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: AuthUser }>();
    if (!req.headers['x-test-user']) throw new UnauthorizedException();
    req.user = JSON.parse(req.headers['x-test-user']) as AuthUser;
    return true;
  }
}

maybe('Pre-marital counselling over HTTP, against Postgres', () => {
  const prisma = url
    ? new PrismaClient({ datasources: { db: { url } } })
    : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const otherTenant = randomUUID();
  const config = {
    get: (k: string) =>
      k === 'DEFAULT_TENANT_ID'
        ? tenantId
        : k === 'FRONTEND_URL'
          ? 'https://example.org'
          : undefined,
  };
  const sent: { event: string; applicationId: string }[] = [];
  const notifier = {
    send: jest.fn(
      async (app: { id: string }, event: string) => (
        sent.push({ event, applicationId: app.id }),
        'SENT'
      ),
    ),
  };
  // The documents email replaced the received email; its own tests are in
  // documents/documents.http.db.spec.ts. Here it stands in and is recorded.
  const dispatch = {
    prepare: jest.fn(async () => undefined),
    welcome: jest.fn(async (a: { id: string }) => {
      sent.push({ event: 'RECEIVED', applicationId: a.id });
      return 'SENT';
    }),
  };
  // Dashboard sign-ins have their own tests (documents/documents.http.db.spec.ts).
  const accounts = { provision: jest.fn(async () => []) };
  let app: INestApplication;
  const people: Record<
    | 'pastor'
    | 'superAdmin'
    | 'ministry'
    | 'counsellorA'
    | 'counsellorB'
    | 'member',
    { profileId: string; header: string }
  > = {} as never;

  const header = (profileId: string, roles: Role[]) =>
    JSON.stringify({
      userId: `u-${profileId}`,
      email: 'x@example.com',
      role: roles.at(-1),
      effectiveRoles: [Role.MEMBER, ...roles],
      unitLeadOf: [],
      hodOf: [],
      headUsher: false,
      profileId,
      memberId: null,
      tenantId,
    });
  const http = () => request(app.getHttpServer());
  const as = (who: keyof typeof people) => ({
    get: (p: string) => http().get(p).set('x-test-user', people[who].header),
    post: (p: string, b: object = {}) =>
      http().post(p).set('x-test-user', people[who].header).send(b),
    patch: (p: string, b: object) =>
      http().patch(p).set('x-test-user', people[who].header).send(b),
    put: (p: string, b: object = {}) =>
      http().put(p).set('x-test-user', people[who].header).send(b),
  });

  async function caseIn(
    t: string,
    status: 'SUBMITTED' | 'ACCEPTED_FOR_COUNSELLING' = 'SUBMITTED',
  ) {
    const id = randomUUID();
    await prisma.counsellingApplication.create({
      data: {
        id,
        tenantId: t,
        referenceCode: `PMC-${id.slice(0, 6).toUpperCase()}`,
        submissionKey: randomUUID(),
        submissionHash: randomUUID(),
        applicantFirstName: 'Bola',
        applicantLastName: 'Ade',
        applicantEmail: 'bola@example.com',
        applicantPhone: '0803 000 0000',
        partnerFirstName: 'Chi',
        partnerLastName: 'Obi',
        partnerPhone: '0803 111 1111',
        partnerConsentToContact: true,
        membership: 'BOTH_MEMBERS',
        preferredContact: 'EMAIL',
        privacyAcknowledgedAt: new Date(),
        status,
      },
    });
    return id;
  }
  const assign = (
    applicationId: string,
    counsellorProfileId: string,
    isLead = true,
  ) =>
    prisma.counsellingAssignment.create({
      data: {
        id: randomUUID(),
        tenantId,
        applicationId,
        counsellorProfileId,
        isLead,
        assignedById: people.pastor.profileId,
      },
    });

  beforeAll(async () => {
    for (const t of [tenantId, otherTenant])
      await prisma.tenant.create({
        data: { id: t, name: 'Counselling test', slug: `pmc-${t}` },
      });
    const roles: Record<keyof typeof people, Role[]> = {
      pastor: [Role.PASTOR],
      superAdmin: [Role.SUPER_ADMIN],
      ministry: [Role.MARRIAGE_MINISTRY],
      counsellorA: [],
      counsellorB: [],
      member: [],
    };
    for (const key of Object.keys(roles) as (keyof typeof people)[]) {
      const profileId = (
        await prisma.profile.create({
          data: { id: randomUUID(), userId: randomUUID(), tenantId },
        })
      ).id;
      await prisma.member.create({
        data: {
          id: randomUUID(),
          tenantId,
          profileId,
          firstName: key,
          lastName: 'Test',
        },
      });
      people[key] = { profileId, header: header(profileId, roles[key]) };
    }
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
      controllers: [
        PublicPremaritalController,
        PremaritalController,
        PremaritalSessionsController,
      ],
      providers: [
        CaseAccess,
        PolicyService,
        PublicApplicationsService,
        CaseReadsService,
        CaseActionsService,
        // Deleting cases is covered in documents.http.db.spec.ts.
        { provide: CaseDeleteService, useValue: {} },
        SessionsService,
        DocumentsConfigService,
        { provide: DocumentDispatchService, useValue: dispatch },
        { provide: CoupleAccountsService, useValue: accounts },
        { provide: CounsellingNotifier, useValue: notifier },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: TestAuthGuard },
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
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL ehc.allow_append_only_purge = 'on'`,
      );
      for (const t of [tenantId, otherTenant]) {
        await tx.auditLog.deleteMany({ where: { tenantId: t } });
        await tx.counsellingApplication.deleteMany({ where: { tenantId: t } });
        await tx.counsellingModule.deleteMany({ where: { tenantId: t } });
        await tx.counsellingSettings.deleteMany({ where: { tenantId: t } });
        await tx.member.deleteMany({ where: { tenantId: t } });
        await tx.profile.deleteMany({ where: { tenantId: t } });
        await tx.tenant.delete({ where: { id: t } });
      }
    });
    await prisma.$disconnect();
  });

  describe('the public application', () => {
    const submit = (body: object) =>
      http().post('/public/premarital/applications').send(body);

    it('saves a valid application as Submitted, answers with a reference only, and sends the received email', async () => {
      const res = await submit({
        ...validApplication(),
        submissionKey: randomUUID(),
      }).expect(201);
      expect(Object.keys(res.body.data)).toEqual(['referenceCode']);
      const row = await prisma.counsellingApplication.findFirstOrThrow({
        where: { tenantId, referenceCode: res.body.data.referenceCode },
      });
      expect(row).toMatchObject({
        status: 'SUBMITTED',
        applicantEmail: 'tunde@example.com',
        partnerEmail: 'ada@example.com',
        partnerConsentToContact: true,
      });
      expect(
        await prisma.counsellingStatusEvent.count({
          where: { applicationId: row.id, toStatus: 'SUBMITTED' },
        }),
      ).toBe(1);
      expect(sent).toContainEqual({ event: 'RECEIVED', applicationId: row.id });
    });

    it('refuses an invalid one with an error per field, and saves nothing', async () => {
      const before = await prisma.counsellingApplication.count({
        where: { tenantId },
      });
      const res = await submit({
        ...validApplication(),
        submissionKey: randomUUID(),
        applicantEmail: 'nope',
        privacyAcknowledged: false,
      }).expect(400);
      const fields = Object.fromEntries(
        (res.body.error.details as { path: string; message: string }[]).map(
          (d) => [d.path, d.message],
        ),
      );
      expect(fields).toEqual({
        applicantEmail: 'Enter a valid email address',
        privacyAcknowledged: 'Please read and accept the privacy notice',
      });
      expect(
        await prisma.counsellingApplication.count({ where: { tenantId } }),
      ).toBe(before);
    });

    it('a duplicate (the same couple, a new form) gets the same answer and no second case', async () => {
      const res = await submit({
        ...validApplication(),
        submissionKey: randomUUID(),
        applicantEmail: 'TUNDE@example.com',
      }).expect(201);
      const all = await prisma.counsellingApplication.findMany({
        where: { tenantId },
      });
      expect(all).toHaveLength(1);
      expect(res.body.data.referenceCode).toBe(all[0].referenceCode);
    });

    it('a bot that fills the honeypot gets a success answer and nothing is kept', async () => {
      const res = await submit({
        ...validApplication(),
        submissionKey: randomUUID(),
        applicantEmail: 'bot@example.com',
        website: 'http://spam',
      }).expect(201);
      expect(res.body.data.referenceCode).toMatch(/^PMC-/);
      expect(
        await prisma.counsellingApplication.count({
          where: { tenantId, applicantEmail: 'bot@example.com' },
        }),
      ).toBe(0);
    });

    it('is rate limited per address', async () => {
      const res = await submit({
        ...validApplication(),
        submissionKey: randomUUID(),
      });
      const again = await submit({
        ...validApplication(),
        submissionKey: randomUUID(),
      });
      expect([res.status, again.status]).toContain(429);
    });

    it('the page content carries no personal data and no curriculum', async () => {
      const res = await http().get('/public/premarital/page').expect(200);
      expect(res.body.data).not.toHaveProperty('modules');
      expect(res.body.data.policy).toMatchObject({
        eligibility: null,
        fees: null,
        retention: null,
      });
      expect(JSON.stringify(res.body.data)).not.toContain('tunde@example.com');
    });
  });

  describe('who sees what', () => {
    let a: string;
    let b: string;
    beforeAll(async () => {
      a = await caseIn(tenantId, 'ACCEPTED_FOR_COUNSELLING');
      b = await caseIn(tenantId, 'ACCEPTED_FOR_COUNSELLING');
      await assign(a, people.counsellorA.profileId);
      await assign(b, people.counsellorB.profileId);
    });

    it('nobody signed out, and nobody without a role or a case, sees anything', async () => {
      await http().get('/premarital/applications').expect(401);
      await as('member').get('/premarital/applications').expect(404);
      await as('member').get(`/premarital/applications/${a}`).expect(404);
      await as('member').get('/premarital/overview').expect(404);
      const me = await as('member').get('/premarital/access').expect(200);
      expect(me.body.data).toMatchObject({ tier: null, counsellor: false });
    });

    it("counsellor A cannot read or change counsellor B's case: 404", async () => {
      await as('counsellorA').get(`/premarital/applications/${b}`).expect(404);
      await as('counsellorA')
        .post(`/premarital/applications/${b}/sessions`, {
          date: '2099-01-01',
          time: '10:00',
          format: 'ONLINE',
          meetingLink: 'https://meet.example.com/x',
        })
        .expect(404);
      const list = await as('counsellorA')
        .get('/premarital/applications')
        .expect(200);
      expect(list.body.data.items.map((i: { id: string }) => i.id)).toEqual([
        a,
      ]);
      const mine = await as('counsellorA')
        .get(`/premarital/applications/${a}`)
        .expect(200);
      expect(mine.body.data.adminNote).toBeUndefined();
    });

    it("another church's case does not exist here", async () => {
      const foreign = await caseIn(otherTenant);
      await as('pastor').get(`/premarital/applications/${foreign}`).expect(404);
      await as('pastor')
        .post(`/premarital/applications/${foreign}/transitions`, {
          to: 'UNDER_REVIEW',
        })
        .expect(404);
    });

    it('a safeguarding concern leaves the case to the pastors alone', async () => {
      const c = await caseIn(tenantId);
      await as('ministry')
        .post(`/premarital/applications/${c}/safeguarding`, { raised: true })
        .expect(403);
      await as('pastor')
        .post(`/premarital/applications/${c}/safeguarding`, { raised: true })
        .expect(200);
      await as('ministry').get(`/premarital/applications/${c}`).expect(404);
      await as('superAdmin').get(`/premarital/applications/${c}`).expect(404);
      await as('pastor').get(`/premarital/applications/${c}`).expect(200);
    });
  });

  describe('a case from review to completion', () => {
    let id: string;
    beforeAll(async () => {
      id = await caseIn(tenantId);
      // All four documents accepted, so the documents check lets Final review through.
      await prisma.counsellingDocumentRequirement.createMany({
        data: (
          ['PARENTAL_CONSENT_GROOM', 'MEDICAL_CERT_GROOM', 'PARENTAL_CONSENT_BRIDE', 'MEDICAL_CERT_BRIDE'] as const
        ).map((kind) => ({
          id: randomUUID(),
          tenantId,
          applicationId: id,
          kind,
          status: 'VERIFIED' as const,
          verifiedAt: new Date(),
        })),
      });
    });

    it('moves only along the allowed path, records each step, and completing never approves the wedding', async () => {
      await as('ministry')
        .post(`/premarital/applications/${id}/transitions`, { to: 'COMPLETED' })
        .expect(400);
      for (const to of [
        'UNDER_REVIEW',
        'ACCEPTED_FOR_COUNSELLING',
        'IN_COUNSELLING',
        'FINAL_REVIEW',
        'COMPLETED',
      ]) {
        await as('ministry')
          .post(`/premarital/applications/${id}/transitions`, { to })
          .expect(200);
      }
      await as('ministry')
        .post(`/premarital/applications/${id}/transitions`, { to: 'CLOSED' })
        .expect(400);
      expect(
        await prisma.counsellingStatusEvent.count({
          where: { applicationId: id },
        }),
      ).toBe(5);
      expect(
        await prisma.weddingApproval.count({ where: { applicationId: id } }),
      ).toBe(0);
      expect(sent).toContainEqual({ event: 'COMPLETED', applicationId: id });
    });

    it('only a Pastor approves the wedding', async () => {
      await as('ministry')
        .post(`/premarital/applications/${id}/wedding-approval`)
        .expect(403);
      await as('superAdmin')
        .post(`/premarital/applications/${id}/wedding-approval`)
        .expect(403);
      await as('pastor')
        .post(`/premarital/applications/${id}/wedding-approval`, {
          note: 'Approved',
        })
        .expect(201);
      expect(
        await prisma.weddingApproval.count({ where: { applicationId: id } }),
      ).toBe(1);
    });

    it('a logistics note leaves the member link alone (PATCH keeps what is not sent)', async () => {
      const memberId = (
        await prisma.member.findFirstOrThrow({
          where: { profileId: people.member.profileId },
        })
      ).id;
      await as('ministry')
        .patch(`/premarital/applications/${id}/admin`, { memberId })
        .expect(200);
      await as('ministry')
        .patch(`/premarital/applications/${id}/admin`, {
          adminNote: 'Prefers evenings',
        })
        .expect(200);
      expect(
        await prisma.counsellingApplication.findUniqueOrThrow({
          where: { id },
        }),
      ).toMatchObject({ memberId, adminNote: 'Prefers evenings' });
    });

    it('audit events name who, what and which record, never the answers, and cannot be edited', async () => {
      await as('pastor').get(`/premarital/applications/${id}`).expect(200);
      const events = await prisma.auditLog.findMany({
        where: { tenantId, entityId: id },
      });
      expect(events.map((e) => e.action)).toEqual(
        expect.arrayContaining([
          'COUNSELLING_STATUS_UNDER_REVIEW',
          'COUNSELLING_ADMIN_UPDATED',
          'COUNSELLING_READ',
        ]),
      );
      for (const e of events) expect([e.before, e.after]).toEqual([null, null]);
      await expect(
        prisma.auditLog.delete({ where: { id: events[0].id } }),
      ).rejects.toThrow(/append-only/);
    });
  });

  describe('sessions', () => {
    let id: string;
    beforeAll(async () => {
      id = await caseIn(tenantId, 'ACCEPTED_FOR_COUNSELLING');
      await assign(id, people.counsellorA.profileId);
    });

    it('a session at 00:30 Lagos is stored as 23:30 UTC the day before, and shows on the Lagos day', async () => {
      const res = await as('counsellorA')
        .post(`/premarital/applications/${id}/sessions`, {
          date: '2099-12-01',
          time: '00:30',
          format: 'PHYSICAL',
          location: 'Church office',
        })
        .expect(201);
      expect(res.body.data.scheduledAt).toBe('2099-11-30T23:30:00.000Z');
      const list = await as('counsellorA')
        .get('/premarital/sessions?from=2099-12-01&to=2099-12-01')
        .expect(200);
      expect(list.body.data.map((s: { id: string }) => s.id)).toEqual([
        res.body.data.id,
      ]);
      const dayBefore = await as('counsellorA')
        .get('/premarital/sessions?from=2099-11-30&to=2099-11-30')
        .expect(200);
      expect(dayBefore.body.data).toEqual([]);
    });

    it('changing the length keeps the place, and counsellor B cannot touch it', async () => {
      const session = await prisma.counsellingSession.findFirstOrThrow({
        where: { applicationId: id },
      });
      await as('counsellorA')
        .patch(`/premarital/sessions/${session.id}`, { durationMinutes: 90 })
        .expect(200);
      expect(
        await prisma.counsellingSession.findUniqueOrThrow({
          where: { id: session.id },
        }),
      ).toMatchObject({ durationMinutes: 90, location: 'Church office' });
      await as('counsellorB')
        .patch(`/premarital/sessions/${session.id}`, { durationMinutes: 30 })
        .expect(404);
      const theirs = await as('counsellorB')
        .get('/premarital/sessions?from=2099-11-01&to=2099-12-31')
        .expect(200);
      expect(theirs.body.data).toEqual([]);
    });

    it('moving a session keeps the old one as rescheduled', async () => {
      const session = await prisma.counsellingSession.findFirstOrThrow({
        where: { applicationId: id, status: 'SCHEDULED' },
      });
      const res = await as('counsellorA')
        .post(`/premarital/sessions/${session.id}/reschedule`, {
          date: '2099-12-02',
          time: '18:00',
        })
        .expect(201);
      expect(res.body.data).toMatchObject({
        rescheduledFromId: session.id,
        status: 'SCHEDULED',
        location: 'Church office',
      });
      expect(
        (
          await prisma.counsellingSession.findUniqueOrThrow({
            where: { id: session.id },
          })
        ).status,
      ).toBe('RESCHEDULED');
      expect(sent).toContainEqual({
        event: 'SESSION_RESCHEDULED',
        applicationId: id,
      });
    });
  });
});
