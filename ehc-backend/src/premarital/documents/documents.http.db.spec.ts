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
import { ModulesService } from '../modules.service';
import { PolicyService } from '../policy';
import { PremaritalController } from '../premarital.controller';
import { validApplication } from '../premarital.fixture-spec';
import { PublicApplicationsService } from '../public-applications.service';
import { PublicPremaritalController } from '../public-premarital.controller';
import { CoupleAccessService } from './couple-access.service';
import { CoupleDocumentsController } from './couple-documents.controller';
import { CoupleDocumentsService } from './couple-documents.service';
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

/**
 * Pre-marital documents over HTTP against a disposable Postgres
 * (PIPELINE_TEST_DATABASE_URL; skipped otherwise): the letters email, the
 * couple's page (link, code, scope, uploads) and the office side (viewing,
 * reviewing, the documents check, deleting a closed case's files). Storage
 * and email are in-memory stand-ins; everything else is real.
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
  get configured() {
    return true;
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

const COOKIE_PATH = '/api/backend/public/premarital/documents';
const GENERIC = "This link isn't working. Please ask the church office for a new one.";

maybe('Pre-marital documents over HTTP, against Postgres', () => {
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
    contactUrl: 'https://example.org/contact',
    linkFor: (raw: string) => `https://example.org/pre-marital-counselling/documents#t=${raw}`,
    send: jest.fn(async (a: { id: string }, event: string, payload: SendEmailPayload) => {
      mails.push({ applicationId: a.id, event, payload });
      return { status: mailStatus, messageId: mailStatus === 'SENT' ? 'msg-1' : null };
    }),
  };
  const acks: string[] = [];
  const notifier = { send: jest.fn(async (a: { id: string }, event: string) => (event === 'RECEIVED' && acks.push(a.id), 'SENT')) };
  const logs: string[] = [];
  const secrets: string[] = [];
  let app: INestApplication;
  let renderer: LetterRenderer;
  let coupleAccess: CoupleAccessService;
  const people: Record<'pastor' | 'superAdmin' | 'ministry' | 'counsellor' | 'member', { profileId: string; header: string }> = {} as never;

  const header = (profileId: string, roles: Role[]) =>
    JSON.stringify({ userId: `u-${profileId}`, email: 'x@example.com', role: roles.at(-1), effectiveRoles: [Role.MEMBER, ...roles], unitLeadOf: [], hodOf: [], headUsher: false, profileId, memberId: null, tenantId });
  const http = () => request(app.getHttpServer());
  const as = (who: keyof typeof people) => ({
    get: (p: string) => http().get(p).set('x-test-user', people[who].header),
    post: (p: string, b: object = {}) => http().post(p).set('x-test-user', people[who].header).send(b),
    patch: (p: string, b: object) => http().patch(p).set('x-test-user', people[who].header).send(b),
  });

  let n = 0;
  async function apply(role: 'GROOM' | 'BRIDE' = 'GROOM') {
    n++;
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
        applicantEmail: `couple${n}-${randomUUID().slice(0, 6)}@example.com`,
        applicantPhone: `0803 ${String(1_000_000 + n).slice(-7)}`,
        partnerPhone: `0809 ${String(2_000_000 + n).slice(-7)}`,
      })
      .expect(201);
    return prisma.counsellingApplication.findFirstOrThrow({ where: { tenantId, referenceCode: res.body.data.referenceCode } });
  }
  const tokenFrom = (p: SendEmailPayload) => {
    const raw = /#t=([A-Za-z0-9_-]+)/.exec(p.text)?.[1];
    if (!raw) throw new Error('no link in the email');
    secrets.push(raw);
    return raw;
  };
  const lastMail = (applicationId: string, event: string) => [...mails].reverse().find((m) => m.applicationId === applicationId && m.event === event);
  const cookieOf = (res: request.Response) => String((res.headers['set-cookie'] as unknown as string[])[0]).split(';')[0];

  /** Link, code, verified cookie. */
  async function signIn(applicationId: string, raw: string) {
    const access = await http().post('/public/premarital/documents/access').send({ token: raw }).expect(200);
    const linkCookie = cookieOf(access);
    await http().post('/public/premarital/documents/code').set('Cookie', linkCookie).expect(200);
    const code = /Your code is (\d{6})/.exec(lastMail(applicationId, 'DOCUMENT_CODE')!.payload.text)![1];
    secrets.push(code);
    const ok = await http().post('/public/premarital/documents/code/verify').set('Cookie', linkCookie).send({ code }).expect(200);
    return cookieOf(ok);
  }
  const upload = (cookie: string, kind: string, file: Buffer, name = 'scan.pdf') =>
    http().post(`/public/premarital/documents/${kind}/upload`).set('Cookie', cookie).attach('file', file, name);
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
      const profileId = (await prisma.profile.create({ data: { id: randomUUID(), userId: randomUUID(), tenantId } })).id;
      await prisma.member.create({ data: { id: randomUUID(), tenantId, profileId, firstName: key, lastName: 'Test' } });
      people[key] = { profileId, header: header(profileId, roles[key]) };
    }
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 1000 }], skipIf: () => true })],
      controllers: [PublicPremaritalController, PremaritalController, CoupleDocumentsController, PremaritalDocumentsController],
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
        CoupleAccessService,
        CoupleDocumentsService,
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
    coupleAccess = moduleRef.get(CoupleAccessService);
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

  describe('the letters email', () => {
    it('a new application creates the checklist and one link, and sends one email with both letters and the link', async () => {
      const a = await apply('GROOM');
      const reqs = await prisma.counsellingDocumentRequirement.findMany({ where: { applicationId: a.id } });
      expect(reqs.map((r) => r.kind).sort()).toEqual(['MEDICAL_CERT_BRIDE', 'MEDICAL_CERT_GROOM', 'PARENTAL_CONSENT']);
      expect(reqs.every((r) => r.status === 'PENDING')).toBe(true);
      const tokens = await prisma.counsellingAccessToken.findMany({ where: { applicationId: a.id } });
      expect(tokens).toHaveLength(1);
      expect(tokens[0].scope).toBe('ALL');
      const sentToThem = mails.filter((m) => m.applicationId === a.id);
      expect(sentToThem.map((m) => m.event)).toEqual(['DOCUMENTS']);
      const { payload } = sentToThem[0];
      expect(payload.to).toBe(a.applicantEmail);
      const files = (payload.attachments ?? []) as { filename: string; content: Buffer }[];
      expect(files.map((f) => f.filename)).toEqual(['Parental-Consent.pdf', 'Medical-Screening-Requirement.pdf']);
      for (const f of files) expect(f.content.subarray(0, 5).toString()).toBe('%PDF-');
      expect(tokenFrom(payload)).toHaveLength(43);
      // A short, general email: no partner details, nothing medical beyond the letter's name.
      expect(payload.text).not.toContain('Ada');
      expect(payload.text.toLowerCase()).not.toMatch(/hiv|hepatitis|genotype|syphilis/);
      const dispatch = await prisma.counsellingDocumentDispatch.findFirstOrThrow({ where: { applicationId: a.id } });
      expect(dispatch).toMatchObject({ status: 'SENT', resendMessageId: 'msg-1', requestedById: null });
      expect(dispatch.consentTemplateId).toBeTruthy();
      expect(acks).not.toContain(a.id);
    });

    it('refuses an application that does not say groom or bride', async () => {
      const { applicantRole: _drop, ...rest } = validApplication();
      void _drop;
      const res = await http().post('/public/premarital/applications').send({ ...rest, submissionKey: randomUUID() }).expect(400);
      expect(JSON.stringify(res.body)).toContain('intending groom or the intending bride');
    });

    it('when the email fails the application stands, a plain acknowledgement goes, the log shows it, and the office can resend', async () => {
      mailStatus = 'FAILED';
      const a = await apply();
      mailStatus = 'SENT';
      expect(acks).toContain(a.id);
      expect((await prisma.counsellingDocumentDispatch.findFirstOrThrow({ where: { applicationId: a.id } })).status).toBe('FAILED');
      const res = await as('ministry').post(`/premarital/applications/${a.id}/documents/send`).expect(201);
      expect(res.body.data.status).toBe('SENT');
      const tokens = await prisma.counsellingAccessToken.findMany({ where: { applicationId: a.id }, orderBy: { createdAt: 'asc' } });
      expect(tokens).toHaveLength(2);
      expect(tokens[0].revokedAt).not.toBeNull();
      expect(tokens[1].revokedAt).toBeNull();
    });

    it('when the letters cannot be built, a plain acknowledgement goes instead and the failure is logged', async () => {
      jest.spyOn(renderer, 'render').mockRejectedValueOnce(new Error('letterhead missing'));
      const a = await apply();
      expect(acks).toContain(a.id);
      expect(mails.filter((m) => m.applicationId === a.id && m.event === 'DOCUMENTS')).toHaveLength(0);
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

    it('maps groom and bride by who applied: a bride applying sees the groom (her partner) named first', async () => {
      const a = await apply('BRIDE');
      const cookie = await signIn(a.id, tokenFrom(lastMail(a.id, 'DOCUMENTS')!.payload));
      const page = await http().get('/public/premarital/documents').set('Cookie', cookie).expect(200);
      expect(page.body.data.firstNames).toEqual(['Tunde', 'Ada']);
      expect(page.headers['cache-control']).toBe('no-store');
    });
  });

  describe('the couple page', () => {
    it('a valid link gives a cookie for these routes only; unknown, expired and revoked links all get the same answer', async () => {
      const a = await apply();
      const raw = tokenFrom(lastMail(a.id, 'DOCUMENTS')!.payload);
      const res = await http().post('/public/premarital/documents/access').send({ token: raw }).expect(200);
      expect(res.body.data.stage).toBe('CODE');
      const set = String((res.headers['set-cookie'] as unknown as string[])[0]);
      expect(set).toContain(`Path=${COOKIE_PATH}`);
      expect(set).toMatch(/HttpOnly/);
      expect(set).toMatch(/Secure/);
      expect(set).toMatch(/SameSite=Strict/);
      // Without the code, the page stays shut.
      await http().get('/public/premarital/documents').set('Cookie', cookieOf(res)).expect(404);

      const unknown = await http().post('/public/premarital/documents/access').send({ token: 'x'.repeat(43) }).expect(404);
      await prisma.counsellingAccessToken.updateMany({ where: { applicationId: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      const expired = await http().post('/public/premarital/documents/access').send({ token: raw }).expect(404);
      await prisma.counsellingAccessToken.updateMany({ where: { applicationId: a.id }, data: { expiresAt: new Date(Date.now() + 86_400_000), revokedAt: new Date() } });
      const revoked = await http().post('/public/premarital/documents/access').send({ token: raw }).expect(404);
      for (const r of [unknown, expired, revoked]) expect(r.body.error.message).toBe(GENERIC);
    });

    it('the code: a wrong one fails, five wrong tries use it up, and no more than three codes an hour', async () => {
      const a = await apply();
      const raw = tokenFrom(lastMail(a.id, 'DOCUMENTS')!.payload);
      const linkCookie = cookieOf(await http().post('/public/premarital/documents/access').send({ token: raw }).expect(200));
      await http().post('/public/premarital/documents/code').set('Cookie', linkCookie).expect(200);
      const code = /Your code is (\d{6})/.exec(lastMail(a.id, 'DOCUMENT_CODE')!.payload.text)![1];
      secrets.push(code);
      const wrong = code === '000000' ? '111111' : '000000';
      for (let i = 0; i < 5; i++)
        await http().post('/public/premarital/documents/code/verify').set('Cookie', linkCookie).send({ code: wrong }).expect(422);
      await http().post('/public/premarital/documents/code/verify').set('Cookie', linkCookie).send({ code }).expect(422);
      await http().post('/public/premarital/documents/code').set('Cookie', linkCookie).expect(200);
      await http().post('/public/premarital/documents/code').set('Cookie', linkCookie).expect(200);
      await http().post('/public/premarital/documents/code').set('Cookie', linkCookie).expect(429);
      const fresh = /Your code is (\d{6})/.exec(lastMail(a.id, 'DOCUMENT_CODE')!.payload.text)![1];
      secrets.push(fresh);
      await http().post('/public/premarital/documents/code/verify').set('Cookie', linkCookie).send({ code: fresh }).expect(200);
    });

    it('a groom link can neither see nor upload the bride certificate', async () => {
      const a = await apply();
      const raw = await prisma.$transaction((tx) => coupleAccess.createToken(tx, { applicationId: a.id, scope: 'GROOM', validDays: 60, createdById: null }));
      secrets.push(raw);
      const cookie = await signIn(a.id, raw);
      const page = await http().get('/public/premarital/documents').set('Cookie', cookie).expect(200);
      expect(page.body.data.documents.map((d: { kind: string }) => d.kind)).toEqual(['PARENTAL_CONSENT', 'MEDICAL_CERT_GROOM']);
      await http().post('/public/premarital/documents/consent').set('Cookie', cookie).send({ kind: 'MEDICAL_CERT_BRIDE' }).expect(404);
      await upload(cookie, 'MEDICAL_CERT_BRIDE', await pdf()).expect(404);
    });

    describe('uploads', () => {
      let a: Awaited<ReturnType<typeof apply>>;
      let cookie: string;
      beforeAll(async () => {
        a = await apply();
        cookie = await signIn(a.id, tokenFrom(lastMail(a.id, 'DOCUMENTS')!.payload));
      });

      it('refuses a renamed .exe, an oversized file and a PDF with JavaScript', async () => {
        await upload(cookie, 'PARENTAL_CONSENT', Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2000, 1)]), 'letter.pdf').expect(400);
        await upload(cookie, 'PARENTAL_CONSENT', Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(11 * 1024 * 1024, 32)])).expect(413);
        const js = await PDFDocument.create();
        js.addPage();
        js.addJavaScript('x', 'app.alert(1)');
        await upload(cookie, 'PARENTAL_CONSENT', Buffer.from(await js.save())).expect(400);
        expect((await requirement(a.id, 'PARENTAL_CONSENT')).status).toBe('PENDING');
      });

      it('blocks a medical certificate until the consent box is ticked, then strips the photo, seals it, and shows status only', async () => {
        const image = await photo();
        await upload(cookie, 'MEDICAL_CERT_GROOM', image, 'cert.jpg').expect(400);
        await http().post('/public/premarital/documents/consent').set('Cookie', cookie).send({ kind: 'MEDICAL_CERT_GROOM' }).expect(200);
        await upload(cookie, 'MEDICAL_CERT_GROOM', image, 'cert.jpg').expect(200);
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
        const page = await http().get('/public/premarital/documents').set('Cookie', cookie).expect(200);
        const body = JSON.stringify(page.body);
        expect(body).not.toMatch(/storageKey|sha256|wrapped|%PDF|EHCD1|base64/);
        expect(page.body.data.documents.find((d: { kind: string }) => d.kind === 'MEDICAL_CERT_GROOM')).toMatchObject({ status: 'UPLOADED', canUpload: true, needsConsent: false });
      });

      it('a replacement deletes the old object only after the new one is stored; a failed upload leaves the old file alone', async () => {
        await upload(cookie, 'PARENTAL_CONSENT', await pdf('first')).expect(200);
        const req = await requirement(a.id, 'PARENTAL_CONSENT');
        const first = await prisma.counsellingDocumentFile.findFirstOrThrow({ where: { requirementId: req.id, supersededAt: null } });

        store.failPut = true;
        await upload(cookie, 'PARENTAL_CONSENT', await pdf('broken')).expect(500);
        store.failPut = false;
        const still = await prisma.counsellingDocumentFile.findUniqueOrThrow({ where: { id: first.id } });
        expect(still).toMatchObject({ supersededAt: null, purgedAt: null });
        expect(store.objects.has(first.storageKey)).toBe(true);

        store.ops.length = 0;
        await upload(cookie, 'PARENTAL_CONSENT', await pdf('second')).expect(200);
        const second = await prisma.counsellingDocumentFile.findFirstOrThrow({ where: { requirementId: req.id, supersededAt: null, purgedAt: null } });
        expect(store.ops).toEqual([`put:${second.storageKey}`, `remove:${first.storageKey}`]);
        const old = await prisma.counsellingDocumentFile.findUniqueOrThrow({ where: { id: first.id } });
        expect(old.supersededAt).not.toBeNull();
        expect(old.purgedAt).not.toBeNull();
        expect(store.objects.has(first.storageKey)).toBe(false);
        expect(await prisma.auditLog.count({ where: { tenantId, action: 'COUNSELLING_DOCUMENT_REPLACED_DELETED', entityId: first.id } })).toBe(1);
      });

      it('an accepted document cannot be replaced until a Pastor reopens it', async () => {
        const req = await requirement(a.id, 'PARENTAL_CONSENT');
        await as('ministry').post(`/premarital/documents/${req.id}/verify`, {}).expect(201);
        await upload(cookie, 'PARENTAL_CONSENT', await pdf('third')).expect(409);
        await as('superAdmin').post(`/premarital/documents/${req.id}/reopen`).expect(404);
        await as('pastor').post(`/premarital/documents/${req.id}/reopen`).expect(201);
        await upload(cookie, 'PARENTAL_CONSENT', await pdf('third')).expect(200);
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
        const cookie = await signIn(target.id, tokenFrom(lastMail(target.id, 'DOCUMENTS')!.payload));
        await upload(cookie, 'PARENTAL_CONSENT', await pdf('consent')).expect(200);
        for (const kind of ['MEDICAL_CERT_GROOM', 'MEDICAL_CERT_BRIDE']) {
          await http().post('/public/premarital/documents/consent').set('Cookie', cookie).send({ kind }).expect(200);
          await upload(cookie, kind, await photo(), 'cert.jpg').expect(200);
        }
      }
      photoBytes = await photo();
      await prisma.counsellingAssignment.create({
        data: { id: randomUUID(), tenantId, applicationId: a.id, counsellorProfileId: people.counsellor.profileId, isLead: true, assignedById: people.pastor.profileId },
      });
    });

    const ticket = (who: keyof typeof people, reqId: string) => as(who).post(`/premarital/documents/${reqId}/view-ticket`);

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
      await as('counsellor').post(`/premarital/documents/${(await requirement(a.id, 'PARENTAL_CONSENT')).id}/verify`, {}).expect(404);
    });

    it('verifying a medical certificate needs the test date and warns when it is outside the window', async () => {
      const med = await requirement(a.id, 'MEDICAL_CERT_GROOM');
      await as('superAdmin').post(`/premarital/documents/${med.id}/verify`, { testDate: '2026-11-01' }).expect(404);
      await as('pastor').post(`/premarital/documents/${med.id}/verify`, {}).expect(400);
      const res = await as('pastor').post(`/premarital/documents/${med.id}/verify`, { testDate: '2020-01-01' }).expect(201);
      expect(res.body.data.warning).toBe('OUTSIDE_VALIDITY_WINDOW');
      secrets.push('2020-01-01');
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
    });

    it('letters download rebuilt as sent; the old application can have its role set once', async () => {
      const res = await as('ministry').get(`/premarital/applications/${a.id}/documents/letters/consent`).expect(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      const legacy = await prisma.counsellingApplication.update({ where: { id: other.id }, data: { applicantRole: null, status: 'UNDER_REVIEW' } });
      await as('ministry').patch(`/premarital/applications/${legacy.id}/role`, { applicantRole: 'BRIDE' }).expect(200);
      await as('ministry').patch(`/premarital/applications/${legacy.id}/role`, { applicantRole: 'GROOM' }).expect(409);
    });
  });

  it('keeps tokens, codes, file details and test dates out of every log line and audit row', async () => {
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
