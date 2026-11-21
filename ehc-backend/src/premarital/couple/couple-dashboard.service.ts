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
import { isMedical, kindsOf, mayUpload, roleOf } from '../documents/document-rules';
import { DocumentStore } from '../documents/document-storage';
import { DocumentsConfigService } from '../documents/documents-config';
import { detectType, UploadInspector } from '../documents/upload-inspector';

/** What each partner sees: their own two documents. */
export const KIND_LABEL: Record<CounsellingRequirementKind, string> = {
  PARENTAL_CONSENT_GROOM: 'Your parental consent letter',
  PARENTAL_CONSENT_BRIDE: 'Your parental consent letter',
  MEDICAL_CERT_GROOM: 'Your medical certificate',
  MEDICAL_CERT_BRIDE: 'Your medical certificate',
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

/**
 * The couple dashboard: each partner signs in (their member account, or the
 * sign-in made for the dashboard) and sees where their application is, and
 * their own two documents: their consent letter and their medical
 * certificate. Everything is submitted here. It never shows a file, a file
 * name, a test date, the other partner's documents, anything a counsellor
 * wrote, the safeguarding flag or the office's notes.
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
    const mine = me.role ? kindsOf(me.role) : [];
    const [assignments, requirements, settings] = await Promise.all([
      this.prisma.counsellingAssignment.findMany({
        where: { tenantId, applicationId: app.id, active: true },
        orderBy: [{ isLead: 'desc' }, { assignedAt: 'asc' }],
        select: { isLead: true, Counsellor: personName },
      }),
      this.prisma.counsellingDocumentRequirement.findMany({ where: { tenantId, applicationId: app.id, kind: { in: mine } } }),
      this.config.values(),
    ]);
    const closed = app.status === 'CLOSED' || !!app.archivedAt;
    const position = POSITION[app.status];
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
      documents: {
        uploadsOpen: this.crypto.configured && this.store.configured && !closed,
        maxUploadMb: settings.maxUploadMb,
        medicalConsentWording: settings.medicalConsentWording,
        neededBefore: NEEDED_BEFORE[settings.documentsRequiredBefore] ?? null,
        lettersAvailable: !!app.applicantRole,
        items: mine
          .map((kind) => requirements.find((r) => r.kind === kind))
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) => ({
            kind: r.kind,
            label: KIND_LABEL[r.kind],
            status: r.status,
            reuploadReason: r.status === 'NEEDS_REUPLOAD' ? r.reuploadReason : null,
            canUpload: !closed && OPEN.includes(r.status),
            needsConsent: isMedical(r.kind) && !r.storageConsentAt,
          })),
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
          : 'This document cannot be replaced now. Please contact the church office.',
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

  /** One of this partner's own two letters, with their name, as last sent. */
  async letter(actor: AuthUser, kind: 'consent' | 'medical'): Promise<Buffer> {
    const me = await this.me(actor);
    if (!me.role) throw notFound();
    const built = await this.letters.lastSent(me.app, me.role);
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
