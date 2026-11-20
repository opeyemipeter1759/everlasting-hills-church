import { CanActivate, ExecutionContext, INestApplication, Injectable, Logger, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthUser } from '../../auth/types/auth-user';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../../common/interceptors/response-envelope.interceptor';
import type { SendEmailPayload } from '../../notifications/notification-events';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { CaseActionsService } from '../case-actions.service';
import { CaseReadsService } from '../case-reads.service';
import { CounsellingNotifier } from '../counselling-notifier';
import { CoupleAccountsService } from '../couple/couple-accounts.service';
import { CoupleController } from '../couple/couple.controller';
import { CoupleDashboardService } from '../couple/couple-dashboard.service';
import { ModulesService } from '../modules.service';
import { PolicyService } from '../policy';
import { PremaritalController } from '../premarital.controller';
import { validApplication } from '../premarital.fixture-spec';
import { PublicApplicationsService } from '../public-applications.service';
import { PublicPremaritalController } from '../public-premarital.controller';
import { DocumentCrypto } from './document-crypto';
import { DocumentDispatchService } from './document-dispatch.service';
import { DocumentLettersService } from './document-letters.service';
import { DocumentMailer } from './document-mailer';
import { DocumentStore } from './document-storage';
import { DocumentsAdminService } from './documents-admin.service';
import { DocumentsConfigService } from './documents-config';
import { PremaritalDocumentsController } from './documents.controller';
import { LetterRenderer } from './letter-renderer';
import { UploadInspector } from './upload-inspector';

/** Supabase Auth, in memory: the accounts the couple dashboard makes and finds. */
type FakeUser = { id: string; email: string; password: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown> };
const mockAuth = { users: new Map<string, FakeUser>(), refuseDigits: false, down: false };
jest.mock('../../members/members-supabase-admin.util', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: async (u: { email: string; password: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown> }) => {
          if (mockAuth.down) return { data: { user: null }, error: { message: 'Auth service is down' } };
          if ([...mockAuth.users.values()].some((x) => x.email.toLowerCase() === u.email.toLowerCase()))
            return { data: { user: null }, error: { message: 'A user with this email address has already been registered' } };
          if (mockAuth.refuseDigits && /^\d+$/.test(u.password))
            return { data: { user: null }, error: { message: 'Password should contain at least one character of each: abc, 123' } };
          const user = { id: (jest.requireActual('crypto') as typeof import('crypto')).randomUUID(), ...u };
          mockAuth.users.set(user.id, user);
          return { data: { user }, error: null };
        },
        getUserById: async (id: string) =>
          mockAuth.users.has(id) ? { data: { user: mockAuth.users.get(id) }, error: null } : { data: { user: null }, error: { message: 'User not found' } },
        listUsers: async () => ({ data: { users: [...mockAuth.users.values()] }, error: null }),
        updateUserById: async (id: string, patch: Partial<FakeUser>) => {
          const user = mockAuth.users.get(id)!;
          Object.assign(user, patch);
          return { data: { user }, error: null };
        },
      },
    },
  }),
}));

/**
 * Pre-marital documents and the couple dashboard over HTTP against a
 * disposable Postgres (PIPELINE_TEST_DATABASE_URL; skipped otherwise): the
 * dashboard sign-ins and welcome emails, each partner's dashboard (fenced off
 * from every other route), uploads, and the office side (viewing, reviewing,
 * the documents check, deleting a closed case's files). Storage, email and
 * Supabase Auth are in-memory stand-ins; everything else is real.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(240_000);

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

class MemoryStore extends DocumentStore {
  objects = new Map<string, Buffer>();
  ops: string[] = [];
  failPut = false;
  ready = true;
  get configured() {
    return this.ready;
  }
  async put(key: string, data: Buffer) {
    if (this.failPut) throw new Error('storage is down');
    this.ops.push(`put:${key}`);
    this.objects.set(key, Buffer.from(data));
  }
  async get(key: string) {
    const o = this.objects.get(key);
    if (!o) throw new Error('missing');
    return o;
  }
  async remove(key: string) {
    this.ops.push(`remove:${key}`);
    this.objects.delete(key);
  }
}

maybe('Pre-marital documents and the couple dashboard over HTTP, against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const values: Record<string, unknown> = {
    DEFAULT_TENANT_ID: tenantId,
    FRONTEND_URL: 'https://example.org',
    COUNSELLING_DOC_KEK_V1: Buffer.alloc(32, 9).toString('base64'),
    COUNSELLING_DOC_KEK_CURRENT: 1,
  };
  const config = { get: (k: string) => values[k] };
  const store = new MemoryStore();
  const mails: { applicationId: string; event: string; payload: SendEmailPayload }[] = [];
  let mailStatus: 'SENT' | 'FAILED' | 'SKIPPED' = 'SENT';
  const mailer = {
    appUrl: 'https://example.org',
    send: jest.fn(async (a: { id: string }, event: string, payload: SendEmailPayload) => {
      mails.push({ applicationId: a.id, event, payload });
      return { status: mailStatus, messageId: mailStatus === 'SENT' ? 'msg-1' : null };
    }),
  };
  const notifier = { send: jest.fn(async () => 'SENT') };
  const logs: string[] = [];
  const secrets: string[] = [];
  let app: INestApplication;
  let renderer: LetterRenderer;
  const people: Record<'pastor' | 'superAdmin' | 'ministry' | 'counsellor' | 'member', { profileId: string; userId: string; header: string; email: string }> =
    {} as never;

  const staffHeader = (profileId: string, userId: string, roles: Role[]) =>
    JSON.stringify({ userId, email: 'x@example.com', role: roles.at(-1) ?? Role.MEMBER, effectiveRoles: [Role.MEMBER, ...roles], unitLeadOf: [], hodOf: [], headUsher: false, profileId, memberId: null, tenantId });
  /** A couple dashboard sign-in: no Profile, no role. */
  const coupleHeader = (userId: string) =>
    JSON.stringify({ userId, email: 'couple@example.com', role: null, effectiveRoles: [], unitLeadOf: [], hodOf: [], headUsher: false, profileId: null, memberId: null, tenantId: null });
  const http = () => request(app.getHttpServer());
  const as = (who: keyof typeof people) => ({
    get: (p: string) => http().get(p).set('x-test-user', people[who].header),
    post: (p: string, b: object = {}) => http().post(p).set('x-test-user', people[who].header).send(b),
    patch: (p: string, b: object) => http().patch(p).set('x-test-user', people[who].header).send(b),
  });

  let n = 0;
  async function apply(role: 'GROOM' | 'BRIDE' = 'GROOM', over: Record<string, unknown> = {}) {
    n++;
    const tag = randomUUID().slice(0, 6);
    const res = await http()
      .post('/public/premarital/applications')
      .send({
        ...validApplication(),
        applicantRole: role,
        submissionKey: randomUUID(),
        applicantFirstName: role === 'GROOM' ? 'Tunde' : 'Ada',
        applicantLastName: role === 'GROOM' ? 'Adeyemi' : 'Eze',
        partnerFirstName: role === 'GROOM' ? 'Ada' : 'Tunde',
        partnerLastName: role === 'GROOM' ? 'Eze' : 'Adeyemi',
        applicantEmail: `applicant${n}-${tag}@example.com`,
        partnerEmail: `partner${n}-${tag}@example.com`,
        applicantPhone: `0803 ${String(1_000_000 + n).slice(-7)}`,
        partnerPhone: `0809 ${String(2_000_000 + n).slice(-7)}`,
        ...over,
      })
      .expect(201);
    const a = await prisma.counsellingApplication.findFirstOrThrow({ where: { tenantId, referenceCode: res.body.data.referenceCode } });
    secrets.push(a.applicantPhone.replace(/\D/g, ''), a.partnerPhone!.replace(/\D/g, ''));
    return a;
  }
  const participant = (applicationId: string, side: 'APPLICANT' | 'PARTNER') =>
    prisma.counsellingParticipant.findUniqueOrThrow({ where: { applicationId_side: { applicationId, side } } });
  /** Requests as one partner, through their own sign-in. */
  async function partner(applicationId: string, side: 'APPLICANT' | 'PARTNER') {
    const { authUserId } = await participant(applicationId, side);
    const h = coupleHeader(authUserId);
    return {
      get: (p: string) => http().get(p).set('x-test-user', h),
      post: (p: string, b: object = {}) => http().post(p).set('x-test-user', h).send(b),
      upload: (kind: string, file: Buffer, name = 'scan.pdf') => http().post(`/counselling/me/documents/${kind}/upload`).set('x-test-user', h).attach('file', file, name),
    };
  }
  const mailsFor = (applicationId: string) => mails.filter((m) => m.applicationId === applicationId);
  const pdf = async (text = 'certificate') => {
    const d = await PDFDocument.create();
    d.addPage().drawText(text);
    return Buffer.from(await d.save());
  };
  const photo = () =>
    sharp({ create: { width: 1200, height: 900, channels: 3, background: '#d8d0c0' } })
      .jpeg()
      .withExif({ IFD0: { Make: 'PhoneMaker' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '7/1 23/1 0/1' } })
      .toBuffer();
  const requirement = (applicationId: string, kind: string) =>
    prisma.counsellingDocumentRequirement.findFirstOrThrow({ where: { tenantId, applicationId, kind: kind as never } });

  beforeAll(async () => {
    for (const m of ['log', 'warn', 'error', 'debug', 'verbose'] as const)
      jest.spyOn(Logger.prototype, m).mockImplementation((...args: unknown[]) => void logs.push(args.map(String).join(' ')));
    await prisma.tenant.create({ data: { id: tenantId, name: 'Documents test', slug: `pmd-${tenantId}` } });
    const roles: Record<keyof typeof people, Role[]> = {
      pastor: [Role.PASTOR],
      superAdmin: [Role.SUPER_ADMIN],
      ministry: [Role.MARRIAGE_MINISTRY],
      counsellor: [],
      member: [],
    };
    for (const key of Object.keys(roles) as (keyof typeof people)[]) {
      const userId = randomUUID();
      const email = `${key}-${tenantId.slice(0, 6)}@example.com`;
      const profileId = (await prisma.profile.create({ data: { id: randomUUID(), userId, tenantId } })).id;
      await prisma.member.create({ data: { id: randomUUID(), tenantId, profileId, firstName: key, lastName: 'Test', email } });
      people[key] = { profileId, userId, email, header: staffHeader(profileId, userId, roles[key]) };
    }
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 1000 }], skipIf: () => true })],
      controllers: [PublicPremaritalController, PremaritalController, CoupleController, PremaritalDocumentsController],
      providers: [
        CaseAccess,
        PolicyService,
        ModulesService,
        PublicApplicationsService,
        CaseReadsService,
        CaseActionsService,
        DocumentsConfigService,
        LetterRenderer,
        DocumentCrypto,
        UploadInspector,
        DocumentLettersService,
        CoupleAccountsService,
        CoupleDashboardService,
        DocumentDispatchService,
        DocumentsAdminService,
        { provide: DocumentStore, useValue: store },
        { provide: DocumentMailer, useValue: mailer },
        { provide: CounsellingNotifier, useValue: notifier },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: TestAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
    renderer = moduleRef.get(LetterRenderer);
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ehc.allow_append_only_purge = 'on'`);
      await tx.auditLog.deleteMany({ where: { tenantId } });
      await tx.counsellingApplication.deleteMany({ where: { tenantId } });
      await tx.counsellingDocumentTemplate.deleteMany({ where: { tenantId } });
      await tx.counsellingModule.deleteMany({ where: { tenantId } });
      await tx.counsellingSettings.deleteMany({ where: { tenantId } });
      await tx.member.deleteMany({ where: { tenantId } });
      await tx.profile.deleteMany({ where: { tenantId } });
      await tx.tenant.delete({ where: { id: tenantId } });
    });
    await prisma.$disconnect();
    jest.restoreAllMocks();
  });

  describe('dashboard sign-ins and the welcome emails', () => {
    it('makes a sign-in for each partner (email, phone digits as a temporary password), and emails each of them; the letters go to the applicant', async () => {
      const a = await apply('GROOM');
      const reqs = await prisma.counsellingDocumentRequirement.findMany({ where: { applicationId: a.id } });
      expect(reqs.map((r) => r.kind).sort()).toEqual(['MEDICAL_CERT_BRIDE', 'MEDICAL_CERT_GROOM', 'PARENTAL_CONSENT']);

      const rows = await prisma.counsellingParticipant.findMany({ where: { applicationId: a.id }, orderBy: { side: 'asc' } });
      expect(rows.map((r) => [r.side, r.accountKind])).toEqual([['APPLICANT', 'COUPLE'], ['PARTNER', 'COUPLE']]);
      expect(rows.every((r) => r.signInSentAt)).toBe(true);
      const applicantUser = mockAuth.users.get(rows[0].authUserId)!;
      expect(applicantUser).toMatchObject({
        email: a.applicantEmail,
        password: a.applicantPhone.replace(/\D/g, ''),
        app_metadata: { account: 'counselling_couple' },
        user_metadata: { needs_password_change: true, temp_password: 'phone' },
      });
      expect(mockAuth.users.get(rows[1].authUserId)!.password).toBe(a.partnerPhone!.replace(/\D/g, ''));
      // No Profile: the API fences these accounts off from everything but the dashboard.
      expect(await prisma.profile.count({ where: { userId: { in: rows.map((r) => r.authUserId) } } })).toBe(0);

      const sent = mailsFor(a.id);
      expect(sent.map((m) => m.event)).toEqual(['DOCUMENTS', 'PARTNER_WELCOME']);
      const [toApplicant, toPartner] = sent.map((m) => m.payload);
      expect(toApplicant.to).toBe(a.applicantEmail);
      expect(toPartner.to).toBe(a.partnerEmail);
      const files = (toApplicant.attachments ?? []) as { filename: string; content: Buffer }[];
      expect(files.map((f) => f.filename)).toEqual(['Parental-Consent.pdf', 'Medical-Screening-Requirement.pdf']);
      for (const f of files) expect(f.content.subarray(0, 5).toString()).toBe('%PDF-');
      expect(toPartner.attachments).toBeUndefined();
      expect(toApplicant.text).toContain(`ending in ${a.applicantPhone.replace(/\D/g, '').slice(-4)}`);
      // Neither email carries the other partner's address, or any password.
      expect(toApplicant.text).not.toContain(a.partnerEmail!);
      expect(toPartner.text).not.toContain(a.applicantEmail);
      for (const p of [toApplicant, toPartner]) {
        expect(p.text).not.toContain(a.applicantPhone.replace(/\D/g, ''));
        expect(p.text).not.toContain(a.partnerPhone!.replace(/\D/g, ''));
        expect(p.text.toLowerCase()).not.toMatch(/hiv|hepatitis|genotype|syphilis/);
      }
      const dispatch = await prisma.counsellingDocumentDispatch.findFirstOrThrow({ where: { applicationId: a.id } });
      expect(dispatch).toMatchObject({ status: 'SENT', resendMessageId: 'msg-1', requestedById: null });
      expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_ACCOUNT_CREATED' } })).toBeGreaterThanOrEqual(2);
    });

    it("refuses an application without the partner's own email and phone, or without groom or bride", async () => {
      const { applicantRole: _drop, ...rest } = validApplication();
      void _drop;
      const noRole = await http().post('/public/premarital/applications').send({ ...rest, submissionKey: randomUUID() }).expect(400);
      expect(JSON.stringify(noRole.body)).toContain('intending groom or the intending bride');
      const noEmail = await http().post('/public/premarital/applications').send({ ...validApplication(), submissionKey: randomUUID(), partnerEmail: '' }).expect(400);
      expect(JSON.stringify(noEmail.body)).toContain("Enter your partner's email address");
      const same = await http()
        .post('/public/premarital/applications')
        .send({ ...validApplication(), submissionKey: randomUUID(), partnerEmail: validApplication().applicantEmail })
        .expect(400);
      expect(JSON.stringify(same.body)).toContain("partner's own email address");
    });

    it('links a member to their usual account instead of making a new one', async () => {
      const a = await apply('BRIDE', { applicantEmail: people.member.email.toUpperCase() });
      const row = await participant(a.id, 'APPLICANT');
      expect(row).toMatchObject({ accountKind: 'MEMBER', authUserId: people.member.userId });
      expect([...mockAuth.users.values()].some((u) => u.email.toLowerCase() === people.member.email)).toBe(false);
      expect(mailsFor(a.id)[0].payload.text).toContain('usual Everlasting Hills account');
    });

    it('reuses a couple account from before: a password someone chose is kept; one never used starts again on the phone number', async () => {
      const first = await apply();
      const used = mockAuth.users.get((await participant(first.id, 'APPLICANT')).authUserId)!;
      used.password = 'chosen-by-them';
      used.user_metadata = { ...used.user_metadata, needs_password_change: false };
      await prisma.counsellingApplication.update({ where: { id: first.id }, data: { status: 'CLOSED' } });

      const again = await apply('GROOM', { applicantEmail: first.applicantEmail, partnerEmail: first.partnerEmail, partnerPhone: '0812 555 0101' });
      expect((await participant(again.id, 'APPLICANT')).authUserId).toBe(used.id);
      expect(used.password).toBe('chosen-by-them');
      expect(mailsFor(again.id)[0].payload.text).toContain('password you chose before');
      const partnerUser = mockAuth.users.get((await participant(again.id, 'PARTNER')).authUserId)!;
      expect(partnerUser.password).toBe('08125550101');
      expect(mailsFor(again.id)[1].payload.text).toContain('ending in 0101');
    });

    it('when the phone number is refused as a password, the account is still made and the email says "Forgot password"', async () => {
      mockAuth.refuseDigits = true;
      const a = await apply();
      mockAuth.refuseDigits = false;
      const user = mockAuth.users.get((await participant(a.id, 'APPLICANT')).authUserId)!;
      expect(user.password).not.toMatch(/^\d+$/);
      expect(user.user_metadata.temp_password).toBe('none');
      expect(mailsFor(a.id)[0].payload.text).toContain('Forgot password');
    });

    it('when sign-ins cannot be made the application stands, the applicant still hears from us, and the office makes them later', async () => {
      mockAuth.down = true;
      const a = await apply();
      mockAuth.down = false;
      expect(await prisma.counsellingParticipant.count({ where: { applicationId: a.id } })).toBe(0);
      expect(mailsFor(a.id).map((m) => m.event)).toEqual(['DOCUMENTS']);
      expect(mailsFor(a.id)[0].payload.text).toContain('still setting up your dashboard');

      const list = await as('ministry').get(`/premarital/applications/${a.id}/documents`).expect(200);
      expect(list.body.data.accounts.map((x: { kind: string | null }) => x.kind)).toEqual([null, null]);
      const res = await as('ministry').post(`/premarital/applications/${a.id}/sign-in`).expect(201);
      expect(res.body.data).toMatchObject({ email: 'SENT', accounts: [{ side: 'APPLICANT', ready: true }, { side: 'PARTNER', ready: true }] });
      expect(mailsFor(a.id).filter((m) => m.event === 'SIGN_IN').map((m) => m.payload.to)).toEqual([a.applicantEmail, a.partnerEmail]);
      await as('counsellor').post(`/premarital/applications/${a.id}/sign-in`).expect(404);
    });

    it('when the email fails the application stands, the log shows it, and the office can resend the letters', async () => {
      mailStatus = 'FAILED';
      const a = await apply();
      mailStatus = 'SENT';
      expect((await prisma.counsellingDocumentDispatch.findFirstOrThrow({ where: { applicationId: a.id } })).status).toBe('FAILED');
      const res = await as('ministry').post(`/premarital/applications/${a.id}/documents/send`).expect(201);
      expect(res.body.data.status).toBe('SENT');
      const resent = mailsFor(a.id).filter((m) => m.event === 'DOCUMENTS').at(-1)!.payload;
      expect(resent.text).toContain('Here are your two letters again');
      expect(resent.text).toContain('ending in');
    });

    it('when the letters cannot be built, the welcome still goes with the sign-in details and the failure is logged', async () => {
      jest.spyOn(renderer, 'render').mockRejectedValueOnce(new Error('letterhead missing'));
      const a = await apply();
      const [first] = mailsFor(a.id);
      expect(first.event).toBe('RECEIVED');
      expect(first.payload.attachments).toBeUndefined();
      expect(first.payload.text).toContain('How to sign in');
      const d = await prisma.counsellingDocumentDispatch.findFirstOrThrow({ where: { applicationId: a.id } });
      expect(d).toMatchObject({ status: 'FAILED', consentTemplateId: null, medicalTemplateId: null });
    });

    it('sends the version a Pastor approved, records it, and only a Pastor may approve', async () => {
      const list = await as('ministry').get('/premarital/document-templates').expect(200);
      const v1 = list.body.data.templates.find((t: { kind: string; version: number }) => t.kind === 'PARENTAL_CONSENT' && t.version === 1);
      const saved = await as('ministry')
        .post('/premarital/document-templates/PARENTAL_CONSENT', { blocks: [...v1.body, { type: 'paragraph', text: 'With every blessing, {groomName} and {brideName}.' }] })
        .expect(201);
      await as('ministry').post(`/premarital/document-templates/${saved.body.data.id}/approve`).expect(403);
      await as('pastor').post('/premarital/document-templates/PARENTAL_CONSENT', { blocks: [{ type: 'paragraph', text: 'Hello {partnerName}' }] }).expect(400);
      await as('pastor').post(`/premarital/document-templates/${saved.body.data.id}/approve`).expect(200);
      const a = await apply();
      const d = await prisma.counsellingDocumentDispatch.findFirstOrThrow({ where: { applicationId: a.id } });
      expect(d.consentTemplateId).toBe(saved.body.data.id);
      const preview = await as('ministry').post('/premarital/document-templates/MEDICAL_SCREENING/preview', { blocks: v1.body }).expect(200);
      expect(preview.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('the couple dashboard', () => {
    it('shows each partner their own application, sessions and documents, and nothing private', async () => {
      const a = await apply('BRIDE');
      await prisma.counsellingApplication.update({ where: { id: a.id }, data: { status: 'ACCEPTED_FOR_COUNSELLING', adminNote: 'Call after 5pm', safeguardingFlaggedAt: new Date() } });
      await prisma.counsellingAssignment.create({
        data: { id: randomUUID(), tenantId, applicationId: a.id, counsellorProfileId: people.counsellor.profileId, isLead: true, assignedById: people.pastor.profileId },
      });
      await prisma.counsellingSession.create({
        data: { id: randomUUID(), tenantId, applicationId: a.id, counsellorProfileId: people.counsellor.profileId, scheduledAt: new Date(Date.now() + 3 * 86_400_000), format: 'ONLINE', meetingLink: 'https://meet.example.org/abc', createdById: people.pastor.profileId },
      });
      const bride = await partner(a.id, 'APPLICANT');
      const res = await bride.get('/counselling/me').expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      const d = res.body.data;
      expect(d.application).toMatchObject({ reference: a.referenceCode, status: 'ACCEPTED_FOR_COUNSELLING', you: { firstName: 'Ada', role: 'BRIDE' }, partner: { firstName: 'Tunde', role: 'GROOM' } });
      expect(d.application.stages.map((s: { state: string }) => s.state)).toEqual(['DONE', 'DONE', 'CURRENT', 'UPCOMING', 'UPCOMING', 'UPCOMING']);
      expect(d.counsellors).toEqual([{ name: 'counsellor Test', lead: true }]);
      expect(d.sessions).toHaveLength(1);
      expect(d.sessions[0]).toMatchObject({ format: 'ONLINE', meetingLink: 'https://meet.example.org/abc', counsellor: 'counsellor Test' });
      expect(d.documents.items.map((i: { kind: string; yours: boolean }) => [i.kind, i.yours])).toEqual([
        ['PARENTAL_CONSENT', true],
        ['MEDICAL_CERT_GROOM', false],
        ['MEDICAL_CERT_BRIDE', true],
      ]);
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/Call after 5pm|safeguard|adminNote|intro|applicantEmail|partnerEmail|@example\.com/);
    });

    it('fences a couple account off from every other route', async () => {
      const a = await apply();
      const groom = await partner(a.id, 'APPLICANT');
      for (const path of ['/premarital/overview', `/premarital/applications/${a.id}`, `/premarital/applications/${a.id}/documents`, '/premarital/access']) {
        const res = await groom.get(path).expect(403);
        expect(res.body.error.message).toBe('This account can only open the pre-marital counselling dashboard.');
      }
      // A sign-in with no application of its own sees nothing.
      const stranger = coupleHeader(randomUUID());
      await http().get('/counselling/me').set('x-test-user', stranger).expect(404);
    });

    it('a member sees the same dashboard through their usual account', async () => {
      const a = await apply('GROOM', { partnerEmail: people.member.email });
      expect((await participant(a.id, 'PARTNER')).accountKind).toBe('MEMBER');
      const res = await as('member').get('/counselling/me').expect(200);
      expect(res.body.data.application).toMatchObject({ reference: a.referenceCode, you: { firstName: 'Ada', role: 'BRIDE' } });
      // The menu shows Pre-marital to a member with an application, and not to anyone else.
      expect((await as('member').get('/premarital/access').expect(200)).body.data.couple).toBe(true);
      expect((await as('counsellor').get('/premarital/access').expect(200)).body.data.couple).toBe(false);
    });

    it('lets both partners download both letters', async () => {
      const a = await apply();
      for (const side of ['APPLICANT', 'PARTNER'] as const) {
        const res = await (await partner(a.id, side)).get('/counselling/me/letters/medical').expect(200);
        expect(res.headers['content-type']).toContain('application/pdf');
      }
      expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_LETTER_DOWNLOADED', entityId: a.id } })).toBe(2);
    });

    it("each partner uploads only the consent letter and their own certificate; the other's is 404", async () => {
      const a = await apply('BRIDE');
      const groom = await partner(a.id, 'PARTNER');
      await groom.post('/counselling/me/documents/consent', { kind: 'MEDICAL_CERT_BRIDE' }).expect(404);
      await groom.upload('MEDICAL_CERT_BRIDE', await pdf()).expect(404);
      await groom.post('/counselling/me/documents/consent', { kind: 'MEDICAL_CERT_GROOM' }).expect(200);
      await groom.upload('MEDICAL_CERT_GROOM', await pdf()).expect(200);
      const file = await prisma.counsellingDocumentFile.findFirstOrThrow({ where: { Requirement: { applicationId: a.id, kind: 'MEDICAL_CERT_GROOM' } } });
      expect(file.uploadedByParticipantId).toBe((await participant(a.id, 'PARTNER')).id);
    });

    it('says uploads are not open yet while storage is not set up', async () => {
      const a = await apply();
      const groom = await partner(a.id, 'APPLICANT');
      store.ready = false;
      expect((await groom.get('/counselling/me').expect(200)).body.data.documents.uploadsOpen).toBe(false);
      await groom.upload('PARENTAL_CONSENT', await pdf()).expect(503);
      store.ready = true;
    });

    describe('uploads', () => {
      let a: Awaited<ReturnType<typeof apply>>;
      let groom: Awaited<ReturnType<typeof partner>>;
      beforeAll(async () => {
        a = await apply();
        groom = await partner(a.id, 'APPLICANT');
      });

      it('refuses a renamed .exe, an oversized file and a PDF with JavaScript', async () => {
        await groom.upload('PARENTAL_CONSENT', Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2000, 1)]), 'letter.pdf').expect(400);
        await groom.upload('PARENTAL_CONSENT', Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(11 * 1024 * 1024, 32)])).expect(413);
        const js = await PDFDocument.create();
        js.addPage();
        js.addJavaScript('x', 'app.alert(1)');
        await groom.upload('PARENTAL_CONSENT', Buffer.from(await js.save())).expect(400);
        expect((await requirement(a.id, 'PARENTAL_CONSENT')).status).toBe('PENDING');
      });

      it('blocks a medical certificate until the consent box is ticked, then strips the photo, seals it, and shows status only', async () => {
        const image = await photo();
        await groom.upload('MEDICAL_CERT_GROOM', image, 'cert.jpg').expect(400);
        await groom.post('/counselling/me/documents/consent', { kind: 'MEDICAL_CERT_GROOM' }).expect(200);
        await groom.upload('MEDICAL_CERT_GROOM', image, 'cert.jpg').expect(200);
        const req = await requirement(a.id, 'MEDICAL_CERT_GROOM');
        expect(req.status).toBe('UPLOADED');
        expect(req.storageConsentAt).not.toBeNull();
        const file = await prisma.counsellingDocumentFile.findFirstOrThrow({ where: { requirementId: req.id } });
        expect(file.storageKey.startsWith(`${tenantId}/`)).toBe(true);
        expect(file.storageKey).not.toMatch(/cert|jpg|Tunde/i);
        const sealed = store.objects.get(file.storageKey)!;
        // Stored bytes are ciphertext, not the photo.
        expect(sealed.subarray(0, 5).toString()).toBe('EHCD1');
        expect(sealed.includes(image.subarray(0, 64))).toBe(false);
        const page = await groom.get('/counselling/me').expect(200);
        expect(JSON.stringify(page.body)).not.toMatch(/storageKey|sha256|wrapped|%PDF|EHCD1|base64/);
        expect(page.body.data.documents.items.find((d: { kind: string }) => d.kind === 'MEDICAL_CERT_GROOM')).toMatchObject({ status: 'UPLOADED', canUpload: true, needsConsent: false });
        // The other partner sees the status, but cannot upload it or read why it was sent back.
        const bride = await partner(a.id, 'PARTNER');
        const theirs = (await bride.get('/counselling/me').expect(200)).body.data.documents.items.find((d: { kind: string }) => d.kind === 'MEDICAL_CERT_GROOM');
        expect(theirs).toMatchObject({ status: 'UPLOADED', yours: false, canUpload: false, reuploadReason: null });
      });

      it('a replacement deletes the old object only after the new one is stored; a failed upload leaves the old file alone', async () => {
        await groom.upload('PARENTAL_CONSENT', await pdf('first')).expect(200);
        const req = await requirement(a.id, 'PARENTAL_CONSENT');
        const first = await prisma.counsellingDocumentFile.findFirstOrThrow({ where: { requirementId: req.id, supersededAt: null } });

        store.failPut = true;
        await groom.upload('PARENTAL_CONSENT', await pdf('broken')).expect(500);
        store.failPut = false;
        const still = await prisma.counsellingDocumentFile.findUniqueOrThrow({ where: { id: first.id } });
        expect(still).toMatchObject({ supersededAt: null, purgedAt: null });
        expect(store.objects.has(first.storageKey)).toBe(true);

        store.ops.length = 0;
        await groom.upload('PARENTAL_CONSENT', await pdf('second')).expect(200);
        const second = await prisma.counsellingDocumentFile.findFirstOrThrow({ where: { requirementId: req.id, supersededAt: null, purgedAt: null } });
        expect(store.ops).toEqual([`put:${second.storageKey}`, `remove:${first.storageKey}`]);
        const old = await prisma.counsellingDocumentFile.findUniqueOrThrow({ where: { id: first.id } });
        expect(old.supersededAt).not.toBeNull();
        expect(old.purgedAt).not.toBeNull();
        expect(store.objects.has(first.storageKey)).toBe(false);
        expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_DOCUMENT_REPLACED_DELETED', entityId: first.id } })).toBe(1);
      });

      it('an accepted document cannot be replaced until a Pastor reopens it; a re-upload request goes to whoever uploaded it', async () => {
        const req = await requirement(a.id, 'PARENTAL_CONSENT');
        await as('ministry').post(`/premarital/documents/${req.id}/verify`, {}).expect(201);
        await groom.upload('PARENTAL_CONSENT', await pdf('third')).expect(409);
        await as('superAdmin').post(`/premarital/documents/${req.id}/reopen`).expect(404);
        await as('pastor').post(`/premarital/documents/${req.id}/reopen`).expect(201);
        await groom.upload('PARENTAL_CONSENT', await pdf('third')).expect(200);
        await as('ministry').post(`/premarital/documents/${req.id}/request-reupload`, { reason: 'MISSING_SIGNATURE' }).expect(201);
        const notice = mailsFor(a.id).filter((m) => m.event === 'DOCUMENT_REUPLOAD').at(-1)!;
        expect(notice.payload.to).toBe(a.applicantEmail);
        const page = await groom.get('/counselling/me').expect(200);
        expect(page.body.data.documents.items.find((d: { kind: string }) => d.kind === 'PARENTAL_CONSENT')).toMatchObject({ status: 'NEEDS_REUPLOAD', reuploadReason: 'MISSING_SIGNATURE' });
      });
    });
  });

  describe('the office side', () => {
    let a: Awaited<ReturnType<typeof apply>>;
    let other: Awaited<ReturnType<typeof apply>>;
    let photoBytes: Buffer;
    beforeAll(async () => {
      a = await apply();
      other = await apply();
      for (const target of [a, other]) {
        const groom = await partner(target.id, 'APPLICANT');
        const bride = await partner(target.id, 'PARTNER');
        await groom.upload('PARENTAL_CONSENT', await pdf('consent')).expect(200);
        for (const [who, kind] of [[groom, 'MEDICAL_CERT_GROOM'], [bride, 'MEDICAL_CERT_BRIDE']] as const) {
          await who.post('/counselling/me/documents/consent', { kind }).expect(200);
          await who.upload(kind, await photo(), 'cert.jpg').expect(200);
        }
      }
      photoBytes = await photo();
      await prisma.counsellingAssignment.create({
        data: { id: randomUUID(), tenantId, applicationId: a.id, counsellorProfileId: people.counsellor.profileId, isLead: true, assignedById: people.pastor.profileId },
      });
    });

    const ticket = (who: keyof typeof people, reqId: string) => as(who).post(`/premarital/documents/${reqId}/view-ticket`);

    it("lists both partners' sign-ins for the office", async () => {
      const list = await as('ministry').get(`/premarital/applications/${a.id}/documents`).expect(200);
      expect(list.body.data.accounts.map((x: { side: string; role: string; kind: string }) => [x.side, x.role, x.kind])).toEqual([
        ['APPLICANT', 'GROOM', 'COUPLE'],
        ['PARTNER', 'BRIDE', 'COUPLE'],
      ]);
      expect(list.body.data.can.resendSignIn).toBe(true);
    });

    it('only a Pastor opens a medical certificate, the file comes back clean, and every view is audited', async () => {
      const med = await requirement(a.id, 'MEDICAL_CERT_GROOM');
      for (const who of ['superAdmin', 'ministry', 'counsellor', 'member'] as const) await ticket(who, med.id).expect(404);
      const t = await ticket('pastor', med.id).expect(201);
      const view = await as('pastor').post('/premarital/documents/view', { ticket: t.body.data.ticket }).buffer(true).parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      }).expect(200);
      expect(view.headers['cache-control']).toBe('no-store');
      expect(view.headers['content-disposition']).toMatch(/^inline/);
      const meta = await sharp(view.body as Buffer).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.width).toBe((await sharp(photoBytes).metadata()).width);
      await as('pastor').post('/premarital/documents/view', { ticket: t.body.data.ticket }).expect(404);
      expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_DOCUMENT_VIEWED', entityId: med.id } })).toBe(1);
      const list = await as('superAdmin').get(`/premarital/applications/${a.id}/documents`).expect(200);
      const medRow = list.body.data.requirements.find((r: { kind: string }) => r.kind === 'MEDICAL_CERT_GROOM');
      expect(medRow.can).toMatchObject({ view: false, verify: false });
      expect(medRow.fileType).toBeNull();
    });

    it('a counsellor opens the consent letter of their own case only, and never sees the medical rows', async () => {
      await ticket('counsellor', (await requirement(a.id, 'PARENTAL_CONSENT')).id).expect(201);
      await ticket('counsellor', (await requirement(other.id, 'PARENTAL_CONSENT')).id).expect(404);
      const list = await as('counsellor').get(`/premarital/applications/${a.id}/documents`).expect(200);
      expect(list.body.data.requirements.map((r: { kind: string }) => r.kind)).toEqual(['PARENTAL_CONSENT']);
      expect(list.body.data.accounts).toEqual([]);
      await as('counsellor').post(`/premarital/documents/${(await requirement(a.id, 'PARENTAL_CONSENT')).id}/verify`, {}).expect(404);
    });

    it('verifying a medical certificate needs the test date and warns when it is outside the window; a re-upload request goes to its owner', async () => {
      const med = await requirement(a.id, 'MEDICAL_CERT_GROOM');
      await as('superAdmin').post(`/premarital/documents/${med.id}/verify`, { testDate: '2026-11-01' }).expect(404);
      await as('pastor').post(`/premarital/documents/${med.id}/verify`, {}).expect(400);
      const res = await as('pastor').post(`/premarital/documents/${med.id}/verify`, { testDate: '2020-01-01' }).expect(201);
      expect(res.body.data.warning).toBe('OUTSIDE_VALIDITY_WINDOW');
      secrets.push('2020-01-01');
      const brideCert = await requirement(a.id, 'MEDICAL_CERT_BRIDE');
      await as('pastor').post(`/premarital/documents/${brideCert.id}/request-reupload`, { reason: 'UNREADABLE' }).expect(201);
      expect(mailsFor(a.id).filter((m) => m.event === 'DOCUMENT_REUPLOAD').at(-1)!.payload.to).toBe(a.partnerEmail);
    });

    it('the documents check holds back Final review until all three are accepted; a Pastor may override with a listed reason', async () => {
      await prisma.counsellingApplication.update({ where: { id: a.id }, data: { status: 'IN_COUNSELLING' } });
      await as('ministry').post(`/premarital/applications/${a.id}/transitions`, { to: 'FINAL_REVIEW' }).expect(409);
      const detail = await as('pastor').get(`/premarital/applications/${a.id}`).expect(200);
      expect(detail.body.data.documentsGate).toMatchObject({ status: 'FINAL_REVIEW', satisfied: false, canOverride: true });
      await as('superAdmin').post(`/premarital/applications/${a.id}/transitions`, { to: 'FINAL_REVIEW', override: { reason: 'PASTORAL_DISCRETION' } }).expect(403);
      await as('pastor').post(`/premarital/applications/${a.id}/transitions`, { to: 'FINAL_REVIEW', override: { reason: 'MADE_UP' } }).expect(400);
      await as('pastor').post(`/premarital/applications/${a.id}/transitions`, { to: 'FINAL_REVIEW', override: { reason: 'PASTORAL_DISCRETION' } }).expect(200);
      expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_DOCUMENT_GATE_OVERRIDE', entityId: a.id } })).toBe(1);
      const ev = await prisma.counsellingStatusEvent.findFirstOrThrow({ where: { applicationId: a.id, toStatus: 'FINAL_REVIEW' } });
      expect(ev.reason).toBe('DOCUMENTS_GATE_OVERRIDE:PASTORAL_DISCRETION');
    });

    it('counts documents awaiting review for the overview, and only what the viewer may review', async () => {
      const pastor = await as('pastor').get('/premarital/overview').expect(200);
      const ministry = await as('ministry').get('/premarital/overview').expect(200);
      expect(pastor.body.data.documentsAwaitingReview).toBeGreaterThan(ministry.body.data.documentsAwaitingReview);
    });

    it('"Delete stored documents" is Pastor only, closed or archived only, keeps the checklist, and is audited', async () => {
      await as('pastor').post(`/premarital/applications/${other.id}/documents/delete-stored`).expect(409);
      await prisma.counsellingApplication.update({ where: { id: other.id }, data: { status: 'CLOSED' } });
      const filtered = await as('pastor').get('/premarital/applications?storedFiles=closed').expect(200);
      expect(filtered.body.data.items.map((i: { id: string }) => i.id)).toContain(other.id);
      for (const who of ['superAdmin', 'ministry', 'counsellor'] as const)
        await as(who).post(`/premarital/applications/${other.id}/documents/delete-stored`).expect(404);
      const consent = await requirement(other.id, 'PARENTAL_CONSENT');
      await prisma.counsellingDocumentRequirement.update({ where: { id: consent.id }, data: { status: 'VERIFIED', verifiedAt: new Date() } });
      const keys = (await prisma.counsellingDocumentFile.findMany({ where: { Requirement: { applicationId: other.id }, purgedAt: null } })).map((f) => f.storageKey);
      expect(keys.length).toBeGreaterThan(0);
      const res = await as('pastor').post(`/premarital/applications/${other.id}/documents/delete-stored`).expect(200);
      expect(res.body.data.deleted).toBe(keys.length);
      for (const k of keys) expect(store.objects.has(k)).toBe(false);
      expect(await prisma.counsellingDocumentFile.count({ where: { Requirement: { applicationId: other.id }, purgedAt: null } })).toBe(0);
      expect(await prisma.counsellingDocumentRequirement.findUniqueOrThrow({ where: { id: consent.id } })).toMatchObject({ status: 'VERIFIED' });
      expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_DOCUMENTS_DELETED', entityId: other.id } })).toBe(1);
      const after = await as('pastor').get('/premarital/applications?storedFiles=closed').expect(200);
      expect(after.body.data.items.map((i: { id: string }) => i.id)).not.toContain(other.id);
      // A closed case: the couple can still look, but uploads are shut.
      const closedView = await (await partner(other.id, 'APPLICANT')).get('/counselling/me').expect(200);
      expect(closedView.body.data.application).toMatchObject({ closed: true, stages: [] });
      expect(closedView.body.data.documents.uploadsOpen).toBe(false);
    });

    it('letters download rebuilt as sent; the old application can have its role set once', async () => {
      const res = await as('ministry').get(`/premarital/applications/${a.id}/documents/letters/consent`).expect(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      const legacy = await prisma.counsellingApplication.update({ where: { id: other.id }, data: { applicantRole: null, status: 'UNDER_REVIEW' } });
      await as('ministry').patch(`/premarital/applications/${legacy.id}/role`, { applicantRole: 'BRIDE' }).expect(200);
      await as('ministry').patch(`/premarital/applications/${legacy.id}/role`, { applicantRole: 'GROOM' }).expect(409);
    });
  });

  it('keeps phone-number passwords, file details and test dates out of every log line and audit row', async () => {
    expect(secrets.length).toBeGreaterThan(5);
    const all = logs.join('\n');
    for (const s of secrets) expect(all).not.toContain(s);
    const audit = await prisma.auditLog.findMany({ where: { tenantId } });
    expect(audit.length).toBeGreaterThan(10);
    for (const row of audit) {
      expect(row.before).toBeNull();
      expect(row.after).toBeNull();
    }
  });
});
