import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CounsellingRequirementKind, CounsellingRequirementStatus } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import type { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { counsellingAudit } from '../counselling-audit';
import type { CoupleSession } from './couple-access.service';
import { LinkNotWorking } from './couple-access.service';
import { DocumentCrypto, DocumentStorageNotReady } from './document-crypto';
import { coupleOf, isMedical, kindsFor } from './document-rules';
import { DocumentStore } from './document-storage';
import { DocumentsConfigService } from './documents-config';
import { detectType, UploadInspector } from './upload-inspector';

export const KIND_LABEL: Record<CounsellingRequirementKind, string> = {
  PARENTAL_CONSENT: 'Parental consent letter',
  MEDICAL_CERT_GROOM: "Intending groom's medical certificate",
  MEDICAL_CERT_BRIDE: "Intending bride's medical certificate",
};
const UPLOADS_PER_HOUR = 20;
/** The couple may upload while a document is waiting, uploaded, or asked for again. */
const OPEN: readonly CounsellingRequirementStatus[] = ['PENDING', 'UPLOADED', 'NEEDS_REUPLOAD'];

/**
 * What the couple's page may do: show the status of the documents in its
 * scope, record the medical storage consent, and take uploads. It never
 * returns a file, a file name, a storage key or anything about a result, so
 * neither partner can see the other's documents through it.
 */
@Injectable()
export class CoupleDocumentsService {
  private readonly logger = new Logger(CoupleDocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly crypto: DocumentCrypto,
    private readonly store: DocumentStore,
    private readonly inspector: UploadInspector,
    private readonly config: DocumentsConfigService,
    private readonly env: ConfigService<Env, true>,
  ) {}

  private get uploadsEnabledByConfig(): boolean {
    return this.env.get('DOCUMENT_UPLOADS_ENABLED', { infer: true }) ?? false;
  }

  get uploadsEnabled(): boolean {
    return this.uploadsEnabledByConfig && this.crypto.configured && this.store.configured;
  }

  assertUploadsEnabled(): void {
    if (!this.uploadsEnabledByConfig)
      throw new ServiceUnavailableException('Online document uploads are not open yet. Please bring your documents to the church office for now.');
    if (!this.crypto.configured || !this.store.configured) throw new DocumentStorageNotReady();
  }

  async page(s: CoupleSession) {
    const kinds = kindsFor(s.scope);
    const [rows, settings] = await Promise.all([
      this.prisma.counsellingDocumentRequirement.findMany({
        where: { tenantId: this.access.tenantId, applicationId: s.app.id, kind: { in: kinds } },
      }),
      this.config.values(),
    ]);
    const couple = coupleOf(s.app);
    const firstNames = couple
      ? s.scope === 'GROOM'
        ? [couple.groom.first]
        : s.scope === 'BRIDE'
          ? [couple.bride.first]
          : [couple.groom.first, couple.bride.first]
      : [s.app.applicantFirstName];
    return {
      firstNames,
      reference: s.app.referenceCode,
      maxUploadMb: settings.maxUploadMb,
      medicalConsentWording: settings.medicalConsentWording,
      uploadsEnabled: this.uploadsEnabled,
      documents: kinds
        .map((kind) => rows.find((r) => r.kind === kind))
        .filter((r): r is NonNullable<typeof r> => !!r)
        .map((r) => ({
          kind: r.kind,
          label: KIND_LABEL[r.kind],
          status: r.status,
          reuploadReason: r.status === 'NEEDS_REUPLOAD' ? r.reuploadReason : null,
          canUpload: this.uploadsEnabled && OPEN.includes(r.status),
          needsConsent: isMedical(r.kind) && !r.storageConsentAt,
        })),
    };
  }

  async consent(s: CoupleSession, kind: CounsellingRequirementKind) {
    this.assertUploadsEnabled();
    if (!isMedical(kind)) throw new BadRequestException('Consent is only asked for medical certificates');
    const req = await this.requirement(s, kind);
    if (!req.storageConsentAt)
      await this.prisma.$transaction(async (tx) => {
        await tx.counsellingDocumentRequirement.update({ where: { id: req.id }, data: { storageConsentAt: new Date() } });
        await counsellingAudit(tx, {
          tenantId: this.access.tenantId,
          actor: null,
          action: 'COUNSELLING_DOCUMENT_CONSENT_RECORDED',
          entity: 'CounsellingDocument',
          entityId: req.id,
        });
      });
    return { recorded: true };
  }

  /**
   * Checks, cleans, seals and stores one document. When it replaces an earlier
   * file, the old object is deleted only after the new one is stored and
   * recorded; any failure before that leaves the old file exactly as it was.
   */
  async upload(s: CoupleSession, kind: CounsellingRequirementKind, file: Buffer | undefined) {
    this.assertUploadsEnabled();
    const req = await this.requirement(s, kind);
    if (!OPEN.includes(req.status))
      throw new ConflictException(
        req.status === 'VERIFIED'
          ? 'This document has been accepted. Please contact the church office if it needs replacing.'
          : 'We already have this document from the church office.',
      );
    if (isMedical(kind) && !req.storageConsentAt) throw new BadRequestException('Please tick the consent box before uploading a medical certificate.');
    if (!file?.length) throw new BadRequestException('Choose a file to upload.');
    const recent = await this.prisma.counsellingDocumentFile.count({
      where: { tenantId: this.access.tenantId, uploadedViaTokenId: s.tokenId, uploadedAt: { gt: new Date(Date.now() - 3_600_000) } },
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
          select: { id: true, storageKey: true },
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
            uploadedViaTokenId: s.tokenId,
          },
        });
        // Conditional: if the office accepted it meanwhile, nothing changes.
        const { count } = await tx.counsellingDocumentRequirement.updateMany({
          where: { id: req.id, status: { in: [...OPEN] } },
          data: { status: 'UPLOADED', uploadedAt: now, reuploadReason: null },
        });
        if (count === 0) throw new ConflictException('This document was just accepted by the church office.');
        await counsellingAudit(tx, { tenantId, actor: null, action: 'COUNSELLING_DOCUMENT_UPLOADED', entity: 'CounsellingDocument', entityId: row.id });
        // Earlier leftovers that could not be deleted before are retried too.
        const leftovers = await tx.counsellingDocumentFile.findMany({
          where: { tenantId, requirementId: req.id, supersededAt: { not: null }, purgedAt: null },
          select: { id: true, storageKey: true },
        });
        return leftovers;
      });
    } catch (err) {
      await this.store.remove(storageKey).catch(() => undefined);
      throw err;
    }

    for (const old of replaced) await this.purgeReplaced(old);
    return { status: 'UPLOADED' as const };
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

  private async requirement(s: CoupleSession, kind: CounsellingRequirementKind) {
    if (!kindsFor(s.scope).includes(kind)) throw new LinkNotWorking();
    const req = await this.prisma.counsellingDocumentRequirement.findFirst({
      where: { tenantId: this.access.tenantId, applicationId: s.app.id, kind },
    });
    if (!req) throw new LinkNotWorking();
    return req;
  }
}
