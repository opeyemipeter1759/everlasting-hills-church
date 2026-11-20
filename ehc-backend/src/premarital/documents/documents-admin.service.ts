import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { CounsellingRequirementKind, CounsellingRequirementStatus } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { z } from 'zod';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { buildDocumentReuploadEmail } from '../../notifications/templates/counselling-documents.email';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess, notFound, requireCan, type CaseTier } from '../case-access';
import { counsellingAudit } from '../counselling-audit';
import { lagosToday } from '../lagos-time';
import { DocumentCrypto } from './document-crypto';
import { DocumentDispatchService } from './document-dispatch.service';
import { DocumentLettersService } from './document-letters.service';
import { DocumentMailer } from './document-mailer';
import { isMedical, lagosDay, mayOpen, mayReview, maySeeRow, validFrom } from './document-rules';
import { DocumentStore } from './document-storage';
import { DocumentsConfigService } from './documents-config';

const VIEW_SECONDS = 60;
const REUPLOAD_REASONS = ['UNREADABLE', 'INCOMPLETE', 'WRONG_DOCUMENT', 'OUTSIDE_VALIDITY_WINDOW', 'MISSING_SIGNATURE', 'OTHER'] as const;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const verifySchema = z.object({
  testDate: z
    .string()
    .regex(DAY, 'Use a date like 2026-11-20')
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), 'Use a date like 2026-11-20')
    .nullish(),
});
export const reuploadSchema = z.object({ reason: z.enum(REUPLOAD_REASONS, { error: 'Pick a reason' }) });
export const roleSchema = z.object({ applicantRole: z.enum(['GROOM', 'BRIDE'], { error: 'Pick groom or bride' }) });

/**
 * The office side of counselling documents. CaseAccess.open runs first, so a
 * case someone cannot see is 404; a medical certificate is 404 for everyone
 * but a Pastor (DocumentRules). Every view, change, download, send and
 * deletion writes an audit event, never with content.
 *
 * Nothing here deletes documents on its own. The only deletion is a Pastor's
 * "Delete stored documents" on a closed or archived case.
 */
@Injectable()
export class DocumentsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly crypto: DocumentCrypto,
    private readonly store: DocumentStore,
    private readonly config: DocumentsConfigService,
    private readonly dispatch: DocumentDispatchService,
    private readonly letters: DocumentLettersService,
    private readonly mailer: DocumentMailer,
  ) {}

  private get tenantId() {
    return this.access.tenantId;
  }

  async list(actor: AuthUser, applicationId: string) {
    const { app, tier } = await this.access.open(actor, applicationId);
    const [reqs, tokens, dispatches, settings] = await Promise.all([
      this.prisma.counsellingDocumentRequirement.findMany({
        where: { tenantId: this.tenantId, applicationId },
        include: { Files: { where: { supersededAt: null, purgedAt: null }, select: { id: true, uploadedAt: true, mimeType: true } } },
      }),
      this.prisma.counsellingAccessToken.findMany({
        where: { tenantId: this.tenantId, applicationId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { scope: true, expiresAt: true, revokedAt: true, lastUsedAt: true, createdAt: true },
      }),
      this.prisma.counsellingDocumentDispatch.findMany({
        where: { tenantId: this.tenantId, applicationId },
        orderBy: { sentAt: 'desc' },
        take: 10,
        select: { id: true, status: true, sentAt: true, requestedById: true },
      }),
      this.config.values(),
    ]);
    const staff = tier !== 'COUNSELLOR';
    const people = await this.names(reqs.flatMap((r) => [r.verifiedById, r.receivedById]));
    const from = validFrom(app.submittedAt, settings.screeningValidityDays);
    const closed = app.status === 'CLOSED' || !!app.archivedAt;
    const stored = staff
      ? await this.prisma.counsellingDocumentFile.count({ where: { tenantId: this.tenantId, purgedAt: null, Requirement: { applicationId } } })
      : 0;
    const order: CounsellingRequirementKind[] = ['PARENTAL_CONSENT', 'MEDICAL_CERT_GROOM', 'MEDICAL_CERT_BRIDE'];
    return {
      applicantRole: app.applicantRole,
      validFrom: from,
      requirements: reqs
        .filter((r) => maySeeRow(tier, r.kind))
        .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
        .map((r) => {
          const review = mayReview(tier, r.kind);
          const file = r.Files[0] ?? null;
          return {
            id: r.id,
            kind: r.kind,
            status: r.status,
            uploadedAt: r.uploadedAt,
            receivedInPersonAt: r.receivedInPersonAt,
            receivedBy: r.receivedById ? (people.get(r.receivedById) ?? null) : null,
            verifiedAt: r.verifiedAt,
            verifiedBy: r.verifiedById ? (people.get(r.verifiedById) ?? null) : null,
            // The test date is medical information: only for those who may open the certificate.
            testDate: review && r.testDate ? r.testDate.toISOString().slice(0, 10) : null,
            reuploadReason: r.reuploadReason,
            storageConsentGiven: isMedical(r.kind) ? !!r.storageConsentAt : null,
            newUpload: r.status === 'UPLOADED',
            hasFile: !!file,
            fileType: file && mayOpen(tier, r.kind) ? file.mimeType : null,
            can: {
              view: !!file && mayOpen(tier, r.kind),
              receive: review && ['PENDING', 'UPLOADED', 'NEEDS_REUPLOAD'].includes(r.status),
              verify: review && ['UPLOADED', 'RECEIVED_IN_PERSON'].includes(r.status),
              reupload: review && ['UPLOADED', 'RECEIVED_IN_PERSON'].includes(r.status),
              reopen: tier === 'PASTOR' && r.status === 'VERIFIED',
            },
          };
        }),
      links: staff
        ? tokens.map((t) => ({
            scope: t.scope,
            createdAt: t.createdAt,
            expiresAt: t.expiresAt,
            lastUsedAt: t.lastUsedAt,
            state: t.revokedAt ? 'REVOKED' : t.expiresAt <= new Date() ? 'EXPIRED' : 'ACTIVE',
          }))
        : [],
      dispatches: staff ? dispatches.map((d) => ({ id: d.id, status: d.status, sentAt: d.sentAt, automatic: !d.requestedById })) : [],
      storedFiles: stored,
      can: {
        setRole: staff && !app.applicantRole,
        send: staff && !!app.applicantRole && !closed,
        reissueLink: staff && reqs.length > 0 && !closed,
        downloadLetters: staff && !!app.applicantRole,
        deleteStored: tier === 'PASTOR' && closed && stored > 0,
      },
    };
  }

  // ---- Viewing a file: a single-use ticket, then the file itself ----

  async viewTicket(actor: AuthUser, requirementId: string) {
    const { req, tier } = await this.openRequirement(actor, requirementId);
    if (!mayOpen(tier, req.kind)) throw notFound();
    const file = await this.currentFile(req.id);
    if (!actor.profileId) throw notFound();
    const raw = randomBytes(32).toString('base64url');
    await this.prisma.counsellingDocumentViewToken.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        fileId: file.id,
        profileId: actor.profileId,
        tokenHash: createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + VIEW_SECONDS * 1000),
      },
    });
    return { ticket: raw, expiresInSeconds: VIEW_SECONDS };
  }

  async view(actor: AuthUser, rawTicket: string): Promise<{ data: Buffer; mimeType: string }> {
    const ticket = await this.prisma.counsellingDocumentViewToken.findFirst({
      where: { tenantId: this.tenantId, tokenHash: createHash('sha256').update(rawTicket).digest('hex') },
      include: { File: { include: { Requirement: true } } },
    });
    if (!ticket || ticket.profileId !== actor.profileId || ticket.usedAt || ticket.expiresAt <= new Date()) throw notFound();
    const used = await this.prisma.counsellingDocumentViewToken.updateMany({ where: { id: ticket.id, usedAt: null }, data: { usedAt: new Date() } });
    if (used.count === 0) throw notFound();
    // Checked again: the person's role or the case may have changed in the last minute.
    const { tier } = await this.access.open(actor, ticket.File.Requirement.applicationId);
    if (!mayOpen(tier, ticket.File.Requirement.kind) || ticket.File.purgedAt) throw notFound();
    const sealed = await this.store.get(ticket.File.storageKey);
    const data = this.crypto.decrypt(sealed, Buffer.from(ticket.File.wrappedDataKey), ticket.File.encryptionKeyVersion);
    await counsellingAudit(this.prisma, { tenantId: this.tenantId, actor, action: 'COUNSELLING_DOCUMENT_VIEWED', entity: 'CounsellingDocument', entityId: ticket.File.requirementId });
    return { data, mimeType: ticket.File.mimeType };
  }

  // ---- Reviewing ----

  async receivedInPerson(actor: AuthUser, requirementId: string) {
    const { req, tier } = await this.openRequirement(actor, requirementId);
    if (!mayReview(tier, req.kind)) throw notFound();
    await this.change(actor, req.id, ['PENDING', 'UPLOADED', 'NEEDS_REUPLOAD'], {
      status: 'RECEIVED_IN_PERSON',
      receivedInPersonAt: new Date(),
      receivedById: actor.profileId ?? null,
      reuploadReason: null,
    }, 'COUNSELLING_DOCUMENT_RECEIVED_IN_PERSON');
    return { status: 'RECEIVED_IN_PERSON' as const };
  }

  /** Accepts a document: genuine, complete, signed and dated in the window. Never a judgement on results. */
  async verify(actor: AuthUser, requirementId: string, raw: unknown) {
    const { req, tier, app } = await this.openRequirement(actor, requirementId);
    if (!mayReview(tier, req.kind)) throw notFound();
    const { testDate } = parseSchema(verifySchema, raw);
    let warning: 'OUTSIDE_VALIDITY_WINDOW' | null = null;
    if (isMedical(req.kind)) {
      if (!testDate) throw new BadRequestException('Enter the test date shown on the certificate.');
      if (testDate > lagosToday()) throw new BadRequestException('The test date cannot be in the future.');
      const { screeningValidityDays } = await this.config.values();
      if (testDate < validFrom(app.submittedAt, screeningValidityDays)) warning = 'OUTSIDE_VALIDITY_WINDOW';
    } else if (testDate) {
      throw new BadRequestException('A consent letter has no test date.');
    }
    await this.change(actor, req.id, ['UPLOADED', 'RECEIVED_IN_PERSON'], {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedById: actor.profileId ?? null,
      testDate: testDate ? new Date(`${testDate}T00:00:00Z`) : null,
      reuploadReason: null,
    }, 'COUNSELLING_DOCUMENT_VERIFIED');
    return { status: 'VERIFIED' as const, warning };
  }

  async requestReupload(actor: AuthUser, requirementId: string, raw: unknown) {
    const { req, tier, app } = await this.openRequirement(actor, requirementId);
    if (!mayReview(tier, req.kind)) throw notFound();
    const { reason } = parseSchema(reuploadSchema, raw);
    await this.change(actor, req.id, ['UPLOADED', 'RECEIVED_IN_PERSON'], { status: 'NEEDS_REUPLOAD', reuploadReason: reason }, 'COUNSELLING_DOCUMENT_REUPLOAD_REQUESTED');
    const email = await this.mailer.send(
      app,
      'DOCUMENT_REUPLOAD',
      buildDocumentReuploadEmail({ firstName: app.applicantFirstName, email: app.applicantEmail, contactUrl: this.mailer.contactUrl }),
    );
    return { status: 'NEEDS_REUPLOAD' as const, email: email.status };
  }

  /** Pastor only: an accepted document goes back for review (or back to the couple if no file is held). */
  async reopen(actor: AuthUser, requirementId: string) {
    const { req, tier } = await this.openRequirement(actor, requirementId);
    if (tier !== 'PASTOR') throw notFound();
    const file = await this.prisma.counsellingDocumentFile.findFirst({
      where: { tenantId: this.tenantId, requirementId: req.id, supersededAt: null, purgedAt: null },
      select: { id: true },
    });
    const status: CounsellingRequirementStatus = file ? 'UPLOADED' : 'PENDING';
    await this.change(actor, req.id, ['VERIFIED'], { status, verifiedAt: null, verifiedById: null, testDate: null }, 'COUNSELLING_DOCUMENT_REOPENED');
    return { status };
  }

  // ---- Links, letters, role ----

  /** Sends (or resends) the letters with a new link. Old links stop working. */
  async send(actor: AuthUser, applicationId: string) {
    const { app, tier } = await this.access.open(actor, applicationId);
    requireCan(tier, 'triage');
    if (!app.applicantRole) throw new BadRequestException('Set who applied (groom or bride) first, so the letters carry the right names.');
    if (app.status === 'CLOSED' || app.archivedAt) throw new ConflictException('This case is closed.');
    const settings = await this.config.values();
    const links = await this.prisma.$transaction(async (tx) => {
      const issued = await this.dispatch.prepare(tx, app, settings, actor.profileId ?? null);
      await counsellingAudit(tx, { tenantId: this.tenantId, actor, action: 'COUNSELLING_DOCUMENTS_SENT', entity: 'CounsellingApplication', entityId: app.id });
      return issued;
    });
    const status = await this.dispatch.send(app, links, { requestedById: actor.profileId ?? null, acknowledgeOnFailure: false });
    return { status };
  }

  /** Revokes every link and emails a new one. */
  async reissueLink(actor: AuthUser, applicationId: string) {
    const { app, tier } = await this.access.open(actor, applicationId);
    requireCan(tier, 'triage');
    if (app.status === 'CLOSED' || app.archivedAt) throw new ConflictException('This case is closed.');
    const has = await this.prisma.counsellingDocumentRequirement.count({ where: { tenantId: this.tenantId, applicationId } });
    if (!has) throw new BadRequestException('Send the documents first.');
    const settings = await this.config.values();
    const links = await this.prisma.$transaction(async (tx) => {
      const issued = await this.dispatch.prepare(tx, app, settings, actor.profileId ?? null);
      await counsellingAudit(tx, { tenantId: this.tenantId, actor, action: 'COUNSELLING_DOCUMENT_LINK_REISSUED', entity: 'CounsellingApplication', entityId: app.id });
      return issued;
    });
    return { email: await this.dispatch.sendLinks(app, links) };
  }

  /** The letters as last sent (or as they would be sent today), rebuilt on demand. */
  async letter(actor: AuthUser, applicationId: string, kind: 'consent' | 'medical'): Promise<Buffer> {
    const { app, tier } = await this.access.open(actor, applicationId);
    requireCan(tier, 'triage');
    if (!app.applicantRole) throw new BadRequestException('Set who applied (groom or bride) first.');
    const last = await this.prisma.counsellingDocumentDispatch.findFirst({
      where: { tenantId: this.tenantId, applicationId, consentTemplateId: { not: null } },
      orderBy: { sentAt: 'desc' },
    });
    const built = await this.letters.lettersFor(app, {
      issueDay: last ? last.issueDate.toISOString().slice(0, 10) : lagosDay(new Date()),
      consentTemplateId: last?.consentTemplateId,
      medicalTemplateId: last?.medicalTemplateId,
    });
    await counsellingAudit(this.prisma, { tenantId: this.tenantId, actor, action: 'COUNSELLING_LETTER_DOWNLOADED', entity: 'CounsellingApplication', entityId: app.id });
    return kind === 'consent' ? built.consent : built.medical;
  }

  /** For applications from before the role question: set once, then fixed. */
  async setRole(actor: AuthUser, applicationId: string, raw: unknown) {
    const { app, tier } = await this.access.open(actor, applicationId);
    requireCan(tier, 'triage');
    const { applicantRole } = parseSchema(roleSchema, raw);
    const { count } = await this.prisma.$transaction(async (tx) => {
      const res = await tx.counsellingApplication.updateMany({ where: { id: app.id, tenantId: this.tenantId, applicantRole: null }, data: { applicantRole } });
      if (res.count) await counsellingAudit(tx, { tenantId: this.tenantId, actor, action: 'COUNSELLING_ROLE_SET', entity: 'CounsellingApplication', entityId: app.id });
      return res;
    });
    if (!count) throw new ConflictException('Who applied is already set for this case.');
    return { applicantRole };
  }

  /**
   * Pastor only, closed or archived cases only: deletes every stored object for
   * the case and marks the files purged. The checklist and its verification
   * records stay. Anyone else gets 404.
   */
  async deleteStored(actor: AuthUser, applicationId: string) {
    const { app, tier } = await this.access.open(actor, applicationId);
    if (tier !== 'PASTOR') throw notFound();
    if (app.status !== 'CLOSED' && !app.archivedAt) throw new ConflictException('Stored documents can only be deleted once the case is closed or archived.');
    const files = await this.prisma.counsellingDocumentFile.findMany({
      where: { tenantId: this.tenantId, purgedAt: null, Requirement: { applicationId } },
      select: { id: true, storageKey: true },
    });
    let deleted = 0;
    for (const f of files) {
      await this.store.remove(f.storageKey);
      const res = await this.prisma.counsellingDocumentFile.updateMany({ where: { id: f.id, purgedAt: null }, data: { purgedAt: new Date() } });
      deleted += res.count;
    }
    await counsellingAudit(this.prisma, { tenantId: this.tenantId, actor, action: 'COUNSELLING_DOCUMENTS_DELETED', entity: 'CounsellingApplication', entityId: app.id });
    return { deleted };
  }

  // ---- helpers ----

  private async openRequirement(actor: AuthUser, requirementId: string) {
    const req = await this.prisma.counsellingDocumentRequirement.findFirst({ where: { id: requirementId, tenantId: this.tenantId } });
    if (!req) throw notFound();
    const { app, tier } = await this.access.open(actor, req.applicationId);
    if (!maySeeRow(tier, req.kind)) throw notFound();
    return { req, tier: tier as CaseTier, app };
  }

  private async currentFile(requirementId: string) {
    const file = await this.prisma.counsellingDocumentFile.findFirst({
      where: { tenantId: this.tenantId, requirementId, supersededAt: null, purgedAt: null },
      select: { id: true },
    });
    if (!file) throw notFound();
    return file;
  }

  private async change(
    actor: AuthUser,
    requirementId: string,
    from: CounsellingRequirementStatus[],
    data: Record<string, unknown>,
    action: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.counsellingDocumentRequirement.updateMany({ where: { id: requirementId, tenantId: this.tenantId, status: { in: from } }, data });
      if (count === 0) throw new ConflictException('This document changed just now. Reload and try again.');
      await counsellingAudit(tx, { tenantId: this.tenantId, actor, action, entity: 'CounsellingDocument', entityId: requirementId });
    });
  }

  private async names(ids: (string | null)[]) {
    const wanted = [...new Set(ids.filter((x): x is string => !!x))];
    if (!wanted.length) return new Map<string, string>();
    const rows = await this.prisma.member.findMany({ where: { profileId: { in: wanted } }, select: { profileId: true, firstName: true, lastName: true } });
    return new Map(rows.map((r) => [r.profileId!, `${r.firstName} ${r.lastName}`]));
  }
}
