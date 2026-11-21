import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CounsellingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import type { CounsellingEmailEvent } from '../notifications/templates/counselling-update.email';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess, notFound, requireCan } from './case-access';
import { counsellingAudit } from './counselling-audit';
import { REQUIREMENT_KINDS } from './documents/document-rules';
import { CounsellingNotifier } from './counselling-notifier';
import { DocumentsConfigService } from './documents/documents-config';
import {
  adminPatchSchema,
  assignSchema,
  requestInfoSchema,
  safeguardingSchema,
  transitionSchema,
  weddingApprovalSchema,
} from './premarital.schema';
import { isFinished, moveStatus } from './status-machine';

/** Which status changes the couple hears about. Everything else is internal. */
const EMAIL_FOR: Partial<Record<CounsellingStatus, CounsellingEmailEvent>> = {
  ADDITIONAL_INFORMATION_REQUIRED: 'INFO_REQUESTED',
  ACCEPTED_FOR_COUNSELLING: 'STATUS_UPDATED',
  CLOSED: 'STATUS_UPDATED',
  COMPLETED: 'COMPLETED',
};

/** Changing a case: status, logistics, counsellors, safeguarding, archive, wedding approval. */
@Injectable()
export class CaseActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly notifier: CounsellingNotifier,
    private readonly documents: DocumentsConfigService,
  ) {}

  private get tenantId() {
    return this.access.tenantId;
  }

  async transition(actor: AuthUser, id: string, raw: unknown) {
    const { app, tier } = await this.access.open(actor, id);
    requireCan(tier, 'triage');
    const { to, reason, override } = parseSchema(transitionSchema, raw);
    const gate = await this.documentsGate(app.id, to);
    if (gate.blocked) {
      if (!override)
        throw new ConflictException(
          'All three documents must be accepted before this step. A Pastor can override this with a reason.',
        );
      if (tier !== 'PASTOR')
        throw new ForbiddenException('Only a Pastor can move past the documents check.');
      if (!gate.reasons.some((r) => r.code === override.reason))
        throw new BadRequestException('Pick one of the listed reasons.');
    }
    await this.move(
      actor,
      app,
      to,
      gate.blocked ? `DOCUMENTS_GATE_OVERRIDE:${override!.reason}` : reason,
      gate.blocked,
    );
    return { status: to };
  }

  /** Whether moving into this status needs all four documents accepted, and whether they are. */
  private async documentsGate(applicationId: string, to: CounsellingStatus) {
    const settings = await this.documents.values();
    if (to !== settings.documentsRequiredBefore)
      return { blocked: false, reasons: settings.overrideReasons };
    const verified = await this.prisma.counsellingDocumentRequirement.count({
      where: { tenantId: this.tenantId, applicationId, status: 'VERIFIED' },
    });
    return { blocked: verified < REQUIREMENT_KINDS.length, reasons: settings.overrideReasons };
  }

  /** Asks the couple for more: only from Under review, and the email never carries the reason. */
  async requestInfo(actor: AuthUser, id: string, raw: unknown) {
    const { app, tier } = await this.access.open(actor, id);
    requireCan(tier, 'triage');
    const { reason } = parseSchema(requestInfoSchema, raw);
    await this.move(actor, app, 'ADDITIONAL_INFORMATION_REQUIRED', reason);
    return { status: 'ADDITIONAL_INFORMATION_REQUIRED' as const };
  }

  private async move(
    actor: AuthUser,
    app: {
      id: string;
      status: CounsellingStatus;
      tenantId: string;
      applicantFirstName: string;
      applicantEmail: string;
    },
    to: CounsellingStatus,
    reason?: string | null,
    gateOverridden = false,
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (gateOverridden)
        await counsellingAudit(tx, {
          tenantId: this.tenantId,
          actor,
          action: 'COUNSELLING_DOCUMENT_GATE_OVERRIDE',
          entity: 'CounsellingApplication',
          entityId: app.id,
        });
      await moveStatus(tx, {
        tenantId: this.tenantId,
        applicationId: app.id,
        from: app.status,
        to,
        actorProfileId: actor.profileId ?? null,
        reason,
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: `COUNSELLING_STATUS_${to}`,
        entity: 'CounsellingApplication',
        entityId: app.id,
      });
    });
    const event = EMAIL_FOR[to];
    if (event) await this.notifier.send(app, event);
  }

  /** Logistics only. A field that is not sent is left as it is. */
  async updateAdmin(actor: AuthUser, id: string, raw: unknown) {
    const { tier } = await this.access.open(actor, id);
    requireCan(tier, 'triage');
    const patch = parseSchema(adminPatchSchema, raw);
    if (patch.memberId) {
      const member = await this.prisma.member.findFirst({
        where: { id: patch.memberId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!member) throw new BadRequestException('That member was not found');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.counsellingApplication.update({ where: { id }, data: patch });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_ADMIN_UPDATED',
        entity: 'CounsellingApplication',
        entityId: id,
      });
    });
    return { updated: Object.keys(patch) };
  }

  /** Adds a counsellor, or makes one the lead (the previous lead stays on as a counsellor). */
  async assign(actor: AuthUser, id: string, raw: unknown) {
    const { app, tier } = await this.access.open(actor, id);
    requireCan(tier, 'assign');
    if (isFinished(app.status))
      throw new BadRequestException('This case is finished');
    const { counsellorProfileId, isLead = false } = parseSchema(
      assignSchema,
      raw,
    );
    const counsellor = await this.prisma.profile.findFirst({
      where: { id: counsellorProfileId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!counsellor) throw new BadRequestException('That person was not found');
    await this.prisma.$transaction(async (tx) => {
      if (isLead) {
        await tx.counsellingAssignment.updateMany({
          where: { applicationId: id, active: true, isLead: true },
          data: { isLead: false },
        });
      }
      const current = await tx.counsellingAssignment.findFirst({
        where: { applicationId: id, counsellorProfileId, active: true },
      });
      if (current) {
        await tx.counsellingAssignment.update({
          where: { id: current.id },
          data: { isLead: isLead || current.isLead },
        });
      } else {
        await tx.counsellingAssignment.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            applicationId: id,
            counsellorProfileId,
            isLead,
            assignedById: actor.profileId ?? actor.userId,
          },
        });
      }
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_ASSIGNED',
        entity: 'CounsellingApplication',
        entityId: id,
      });
    });
    if (isLead) await this.notifier.send(app, 'COUNSELLOR_ASSIGNED');
    return { assigned: counsellorProfileId, isLead };
  }

  async unassign(actor: AuthUser, assignmentId: string) {
    const row = await this.prisma.counsellingAssignment.findFirst({
      where: { id: assignmentId, tenantId: this.tenantId, active: true },
    });
    if (!row) throw notFound();
    const { tier } = await this.access.open(actor, row.applicationId);
    requireCan(tier, 'assign');
    await this.prisma.$transaction(async (tx) => {
      await tx.counsellingAssignment.update({
        where: { id: assignmentId },
        data: { active: false, isLead: false, endedAt: new Date() },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_UNASSIGNED',
        entity: 'CounsellingApplication',
        entityId: row.applicationId,
      });
    });
    return { ended: assignmentId };
  }

  /** Pastor only. Raising it hides the case from everyone but the pastors. No details are stored. */
  async safeguarding(actor: AuthUser, id: string, raw: unknown) {
    const { tier } = await this.access.open(actor, id);
    requireCan(tier, 'safeguarding');
    const { raised } = parseSchema(safeguardingSchema, raw);
    await this.prisma.$transaction(async (tx) => {
      await tx.counsellingApplication.update({
        where: { id },
        data: raised
          ? {
              safeguardingFlaggedAt: new Date(),
              safeguardingFlaggedById: actor.profileId ?? null,
            }
          : { safeguardingFlaggedAt: null, safeguardingFlaggedById: null },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: raised
          ? 'COUNSELLING_SAFEGUARDING_RAISED'
          : 'COUNSELLING_SAFEGUARDING_CLEARED',
        entity: 'CounsellingApplication',
        entityId: id,
      });
    });
    return { raised };
  }

  /** Soft delete: the case leaves every list. Hard deletion follows the retention process. */
  async archive(actor: AuthUser, id: string) {
    const { app, tier } = await this.access.open(actor, id);
    requireCan(tier, 'archive');
    if (app.archivedAt) return { archived: true };
    await this.prisma.$transaction(async (tx) => {
      await tx.counsellingApplication.update({
        where: { id },
        data: { archivedAt: new Date(), archivedById: actor.profileId ?? null },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_ARCHIVED',
        entity: 'CounsellingApplication',
        entityId: id,
      });
    });
    return { archived: true };
  }

  /** A Pastor's own decision, from final review or after completion. Never automatic. */
  async approveWedding(actor: AuthUser, id: string, raw: unknown) {
    const { app, tier } = await this.access.open(actor, id);
    requireCan(tier, 'wedding');
    if (app.status !== 'FINAL_REVIEW' && app.status !== 'COMPLETED')
      throw new BadRequestException(
        'Wedding approval comes at final review or after counselling is completed',
      );
    const { note } = parseSchema(weddingApprovalSchema, raw);
    if (
      await this.prisma.weddingApproval.findUnique({
        where: { applicationId: id },
        select: { id: true },
      })
    )
      throw new ConflictException('This wedding is already approved');
    const approvalId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      await tx.weddingApproval.create({
        data: {
          id: approvalId,
          tenantId: this.tenantId,
          applicationId: id,
          approvedById: actor.profileId ?? actor.userId,
          note: note || null,
        },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'WEDDING_APPROVED',
        entity: 'WeddingApproval',
        entityId: approvalId,
      });
    });
    return { approved: true };
  }
}
