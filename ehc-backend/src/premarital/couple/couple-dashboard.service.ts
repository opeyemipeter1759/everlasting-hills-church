import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type {
  CounsellingApplicantRole,
  CounsellingApplication,
  CounsellingParticipantSide,
  CounsellingRequirementKind,
  CounsellingRequirementStatus,
  CounsellingStatus,
} from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import type { AuthUser } from '../../auth/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess, notFound } from '../case-access';
import { counsellingAudit } from '../counselling-audit';
import { DocumentCrypto, DocumentStorageNotReady } from '../documents/document-crypto';
import { DocumentLettersService } from '../documents/document-letters.service';
import { isMedical, mayUpload, REQUIREMENT_KINDS, roleOf } from '../documents/document-rules';
import { DocumentStore } from '../documents/document-storage';
import { DocumentsConfigService } from '../documents/documents-config';
import { detectType, UploadInspector } from '../documents/upload-inspector';

export const KIND_LABEL: Record<CounsellingRequirementKind, string> = {
  PARENTAL_CONSENT: 'Parental consent letter',
  MEDICAL_CERT_GROOM: "Intending groom's medical certificate",
  MEDICAL_CERT_BRIDE: "Intending bride's medical certificate",
};
const UPLOADS_PER_HOUR = 20;
/** A partner may upload while a document is waiting, uploaded, or asked for again. */
const OPEN: readonly CounsellingRequirementStatus[] = ['PENDING', 'UPLOADED', 'NEEDS_REUPLOAD'];

/** The couple's view of where the application is. CLOSED stands apart. */
const STAGES = [
  'Application received',
  'Reviewed by the pastors',
  'Accepted for counselling',
  'Counselling sessions',
  'Final review',
  'Completed',
] as const;
const POSITION: Record<CounsellingStatus, number> = {
  SUBMITTED: 1,
  UNDER_REVIEW: 1,
  ADDITIONAL_INFORMATION_REQUIRED: 1,
  ACCEPTED_FOR_COUNSELLING: 2,
  IN_COUNSELLING: 3,
  FINAL_REVIEW: 4,
  COMPLETED: STAGES.length,
  CLOSED: -1,
};
const MESSAGE: Record<CounsellingStatus, string> = {
  SUBMITTED: 'Your application is with the pastoral team. Someone will be in touch about next steps.',
  UNDER_REVIEW: 'The pastors are reviewing your application.',
  ADDITIONAL_INFORMATION_REQUIRED: 'The pastoral team needs a little more information. Someone from the team will contact you.',
  ACCEPTED_FOR_COUNSELLING: 'You have been accepted for counselling. Your counsellor will contact you to plan your first session.',
  IN_COUNSELLING: 'Your counselling sessions are under way.',
  FINAL_REVIEW: 'Your counselling is in its final review with the pastors.',
  COMPLETED: 'Congratulations on completing pre-marital counselling. We are praying for you both.',
  CLOSED: 'This application is closed. Please contact the church office if you have any questions.',
};
const NEEDED_BEFORE: Partial<Record<CounsellingStatus, string>> = {
  ACCEPTED_FOR_COUNSELLING: 'before counselling is accepted',
  IN_COUNSELLING: 'before counselling begins',
  FINAL_REVIEW: 'before the final review',
  COMPLETED: 'before counselling is completed',
};

export interface Me {
  participantId: string;
  side: CounsellingParticipantSide;
  role: CounsellingApplicantRole | null;
  app: CounsellingApplication;
}

const personName = { select: { Member: { select: { firstName: true, lastName: true } } } } as const;
const nameOf = (p: { Member: { firstName: string; lastName: string } | null } | null) =>
  p?.Member ? `${p.Member.firstName} ${p.Member.lastName}`.trim() : null;

/** Only {label, url} pairs with a web address make it to the couple. */
function resourcesOf(raw: unknown): { label: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    const label = (r as { label?: unknown })?.label;
    const url = (r as { url?: unknown })?.url;
    return typeof label === 'string' && typeof url === 'string' && /^https?:\/\//i.test(url) ? [{ label, url }] : [];
  });
}

/**
 * The couple dashboard: each partner signs in (their member account, or the
 * sign-in made for the dashboard) and sees their own application. It never
 * shows a file, a file name, a test date, anything a counsellor wrote, the
 * safeguarding flag or the office's notes. Each partner uploads the consent
 * letter or their own medical certificate; neither can open any document.
 */
@Injectable()
export class CoupleDashboardService {
  private readonly logger = new Logger(CoupleDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly crypto: DocumentCrypto,
    private readonly store: DocumentStore,
    private readonly inspector: UploadInspector,
    private readonly config: DocumentsConfigService,
    private readonly letters: DocumentLettersService,
  ) {}

  /** This person's latest application, or null. */
  async identify(actor: AuthUser): Promise<Me | null> {
    const row = await this.prisma.counsellingParticipant.findFirst({
      where: { tenantId: this.access.tenantId, authUserId: actor.userId },
      orderBy: { Application: { submittedAt: 'desc' } },
      include: { Application: true },
    });
    if (!row) return null;
    return { participantId: row.id, side: row.side, role: roleOf(row.Application.applicantRole, row.side), app: row.Application };
  }

  private async me(actor: AuthUser): Promise<Me> {
    const me = await this.identify(actor);
    if (!me) throw notFound();
    return me;
  }

  async overview(actor: AuthUser) {
    const me = await this.me(actor);
    const { app } = me;
    const tenantId = this.access.tenantId;
    const [sessions, assignments, modules, progress, requirements, settings] = await Promise.all([
      this.prisma.counsellingSession.findMany({
        where: { tenantId, applicationId: app.id, status: { not: 'RESCHEDULED' } },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          format: true,
          location: true,
          meetingLink: true,
          status: true,
          Module: { select: { title: true } },
          Counsellor: personName,
        },
      }),
      this.prisma.counsellingAssignment.findMany({
        where: { tenantId, applicationId: app.id, active: true },
        orderBy: [{ isLead: 'desc' }, { assignedAt: 'asc' }],
        select: { isLead: true, Counsellor: personName },
      }),
      this.prisma.counsellingModule.findMany({
        where: { tenantId, active: true, approvalState: 'APPROVED' },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, description: true, scriptureRefs: true, objectives: true, resources: true },
      }),
      this.prisma.counsellingProgress.findMany({ where: { tenantId, applicationId: app.id }, select: { moduleId: true } }),
      this.prisma.counsellingDocumentRequirement.findMany({ where: { tenantId, applicationId: app.id } }),
      this.config.values(),
    ]);
    const closed = app.status === 'CLOSED' || !!app.archivedAt;
    const position = POSITION[app.status];
    const done = new Set(progress.map((p) => p.moduleId));
    const partnerSide: CounsellingParticipantSide = me.side === 'APPLICANT' ? 'PARTNER' : 'APPLICANT';
    return {
      application: {
        reference: app.referenceCode,
        status: app.status,
        message: app.archivedAt ? MESSAGE.CLOSED : MESSAGE[app.status],
        closed,
        submittedAt: app.submittedAt,
        weddingDate: app.weddingDate ? app.weddingDate.toISOString().slice(0, 10) : null,
        you: { firstName: me.side === 'APPLICANT' ? app.applicantFirstName : app.partnerFirstName, role: me.role },
        partner: { firstName: partnerSide === 'APPLICANT' ? app.applicantFirstName : app.partnerFirstName, role: roleOf(app.applicantRole, partnerSide) },
        stages: closed
          ? []
          : STAGES.map((label, i) => ({ label, state: i < position ? 'DONE' : i === position ? 'CURRENT' : 'UPCOMING' })),
      },
      counsellors: assignments.map((a) => ({ name: nameOf(a.Counsellor), lead: a.isLead })).filter((c) => c.name),
      sessions: sessions.map((s) => ({
        id: s.id,
        scheduledAt: s.scheduledAt,
        durationMinutes: s.durationMinutes,
        format: s.format,
        location: s.format === 'PHYSICAL' ? s.location : null,
        meetingLink: s.format === 'ONLINE' && s.status === 'SCHEDULED' ? s.meetingLink : null,
        status: s.status,
        topic: s.Module?.title ?? null,
        counsellor: nameOf(s.Counsellor),
      })),
      materials: modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        scriptureRefs: m.scriptureRefs,
        objectives: m.objectives,
        resources: resourcesOf(m.resources),
        completed: done.has(m.id),
      })),
      documents: {
        uploadsOpen: this.crypto.configured && this.store.configured && !closed,
        maxUploadMb: settings.maxUploadMb,
        medicalConsentWording: settings.medicalConsentWording,
        neededBefore: NEEDED_BEFORE[settings.documentsRequiredBefore] ?? null,
        lettersAvailable: !!app.applicantRole,
        items: REQUIREMENT_KINDS.map((kind) => requirements.find((r) => r.kind === kind))
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) => {
            const yours = mayUpload(me.role, r.kind);
            return {
              kind: r.kind,
              label: KIND_LABEL[r.kind],
              status: r.status,
              yours,
              // The reason is for the person who uploads it.
              reuploadReason: yours && r.status === 'NEEDS_REUPLOAD' ? r.reuploadReason : null,
              canUpload: yours && !closed && OPEN.includes(r.status),
              needsConsent: yours && isMedical(r.kind) && !r.storageConsentAt,
            };
          }),
      },
    };
  }

  async consent(actor: AuthUser, kind: CounsellingRequirementKind) {
    if (!isMedical(kind)) throw new BadRequestException('Consent is only asked for medical certificates');
    const me = await this.me(actor);
    const req = await this.requirement(me, kind);
    if (!req.storageConsentAt)
      await this.prisma.$transaction(async (tx) => {
        await tx.counsellingDocumentRequirement.update({ where: { id: req.id }, data: { storageConsentAt: new Date() } });
        await counsellingAudit(tx, {
          tenantId: this.access.tenantId,
          actor,
          action: 'COUNSELLING_DOCUMENT_CONSENT_RECORDED',
          entity: 'CounsellingDocument',
          entityId: req.id,
        });
      });
    return { recorded: true };
  }

  /** Whether this partner may upload this document now: storage set up, their own application, a slot they may fill. */
  async checkUpload(actor: AuthUser, kind: CounsellingRequirementKind): Promise<void> {
    if (!this.crypto.configured || !this.store.configured) throw new DocumentStorageNotReady();
    await this.requirement(await this.me(actor), kind);
  }

  /**
   * Checks, cleans, seals and stores one document. When it replaces an earlier
   * file, the old object is deleted only after the new one is stored and
   * recorded; any failure before that leaves the old file exactly as it was.
   */
  async upload(actor: AuthUser, kind: CounsellingRequirementKind, file: Buffer | undefined) {
    const me = await this.me(actor);
    if (!this.crypto.configured || !this.store.configured) throw new DocumentStorageNotReady();
    const req = await this.requirement(me, kind);
    if (me.app.status === 'CLOSED' || me.app.archivedAt) throw new ConflictException('This application is closed.');
    if (!OPEN.includes(req.status))
      throw new ConflictException(
        req.status === 'VERIFIED'
          ? 'This document has been accepted. Please contact the church office if it needs replacing.'
          : 'We already have this document from the church office.',
      );
    if (isMedical(kind) && !req.storageConsentAt) throw new BadRequestException('Please tick the consent box before uploading a medical certificate.');
    if (!file?.length) throw new BadRequestException('Choose a file to upload.');
    const recent = await this.prisma.counsellingDocumentFile.count({
      where: { tenantId: this.access.tenantId, uploadedByParticipantId: me.participantId, uploadedAt: { gt: new Date(Date.now() - 3_600_000) } },
    });
    if (recent >= UPLOADS_PER_HOUR)
      throw new HttpException('That is a lot of uploads in one hour. Please wait a little, then try again.', HttpStatus.TOO_MANY_REQUESTS);

    const type = detectType(file);
    if (!type) throw new BadRequestException('Please upload a PDF, JPG or PNG file.');
    const clean = type === 'application/pdf' ? (await this.inspector.inspectPdf(file), file) : await this.inspector.cleanImage(file, type);

    const sealed = this.crypto.encrypt(clean);
    const storageKey = `${this.access.tenantId}/${randomUUID()}`;
    await this.store.put(storageKey, sealed.blob);

    const tenantId = this.access.tenantId;
    let replaced: { id: string; storageKey: string }[];
    try {
      replaced = await this.prisma.$transaction(async (tx) => {
        const current = await tx.counsellingDocumentFile.findMany({
          where: { tenantId, requirementId: req.id, supersededAt: null, purgedAt: null },
          select: { id: true },
        });
        const now = new Date();
        if (current.length)
          await tx.counsellingDocumentFile.updateMany({ where: { id: { in: current.map((c) => c.id) } }, data: { supersededAt: now } });
        const row = await tx.counsellingDocumentFile.create({
          data: {
            id: randomUUID(),
            tenantId,
            requirementId: req.id,
            storageKey,
            mimeType: type,
            sizeBytes: clean.length,
            sha256: createHash('sha256').update(clean).digest('hex'),
            encryptionKeyVersion: sealed.keyVersion,
            wrappedDataKey: Uint8Array.from(sealed.wrappedKey),
            uploadedByParticipantId: me.participantId,
          },
        });
        // Conditional: if the office accepted it meanwhile, nothing changes.
        const { count } = await tx.counsellingDocumentRequirement.updateMany({
          where: { id: req.id, status: { in: [...OPEN] } },
          data: { status: 'UPLOADED', uploadedAt: now, reuploadReason: null },
        });
        if (count === 0) throw new ConflictException('This document was just accepted by the church office.');
        await counsellingAudit(tx, { tenantId, actor, action: 'COUNSELLING_DOCUMENT_UPLOADED', entity: 'CounsellingDocument', entityId: row.id });
        // Earlier leftovers that could not be deleted before are retried too.
        return tx.counsellingDocumentFile.findMany({
          where: { tenantId, requirementId: req.id, supersededAt: { not: null }, purgedAt: null },
          select: { id: true, storageKey: true },
        });
      });
    } catch (err) {
      await this.store.remove(storageKey).catch(() => undefined);
      throw err;
    }

    for (const old of replaced) await this.purgeReplaced(old);
    return { status: 'UPLOADED' as const };
  }

  /** One of the two letters, as last sent. Both partners may download both. */
  async letter(actor: AuthUser, kind: 'consent' | 'medical'): Promise<Buffer> {
    const me = await this.me(actor);
    if (!me.app.applicantRole) throw notFound();
    const built = await this.letters.lastSent(me.app);
    await counsellingAudit(this.prisma, {
      tenantId: this.access.tenantId,
      actor,
      action: 'COUNSELLING_LETTER_DOWNLOADED',
      entity: 'CounsellingApplication',
      entityId: me.app.id,
    });
    return kind === 'consent' ? built.consent : built.medical;
  }

  /** Deletes a replaced file's object, then marks it purged. A failure leaves it for the next upload or a Pastor. */
  private async purgeReplaced(old: { id: string; storageKey: string }) {
    try {
      await this.store.remove(old.storageKey);
      await this.prisma.$transaction(async (tx) => {
        await tx.counsellingDocumentFile.updateMany({ where: { id: old.id, purgedAt: null }, data: { purgedAt: new Date() } });
        await counsellingAudit(tx, {
          tenantId: this.access.tenantId,
          actor: null,
          action: 'COUNSELLING_DOCUMENT_REPLACED_DELETED',
          entity: 'CounsellingDocument',
          entityId: old.id,
        });
      });
    } catch {
      this.logger.warn(`A replaced counselling document ${old.id} could not be deleted yet`);
    }
  }

  /** The requirement row, only if this partner may upload it. Anything else is 404. */
  private async requirement(me: Me, kind: CounsellingRequirementKind) {
    if (!mayUpload(me.role, kind)) throw notFound();
    const req = await this.prisma.counsellingDocumentRequirement.findFirst({
      where: { tenantId: this.access.tenantId, applicationId: me.app.id, kind },
    });
    if (!req) throw notFound();
    return req;
  }
}
