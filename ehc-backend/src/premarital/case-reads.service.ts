import { Injectable } from '@nestjs/common';
import { CounsellingStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CaseAccess,
  can,
  notFound,
  staffTierOf,
  type CaseTier,
} from './case-access';
import { counsellingAudit } from './counselling-audit';
import { lagosDayStart } from './lagos-time';
import { DocumentsConfigService } from './documents/documents-config';
import { listQuerySchema } from './premarital.schema';
import { ALLOWED } from './status-machine';

const personName = {
  select: { Member: { select: { firstName: true, lastName: true } } },
} as const;
const nameOf = (
  p: { Member: { firstName: string; lastName: string } | null } | null,
) => (p?.Member ? `${p.Member.firstName} ${p.Member.lastName}`.trim() : null);

/**
 * Reading counselling cases: the overview counts, the list and one case in
 * full. Every list is one query with its joins (no N+1). Opening a case writes
 * an audit event.
 */
@Injectable()
export class CaseReadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly documents: DocumentsConfigService,
  ) {}

  /** What this person may do in the Marriage section; drives the menu. Never 404. */
  async whoAmI(actor: AuthUser) {
    const tier = staffTierOf(actor);
    const counsellor = await this.access.isCounsellor(actor);
    return {
      tier,
      counsellor,
      can: {
        triage: can(tier, 'triage'),
        assign: can(tier, 'assign'),
        curriculum: can(tier, 'curriculum'),
        settings: can(tier, 'settings'),
        wedding: can(tier, 'wedding'),
      },
    };
  }

  /** The cases this person may see, as a where clause; 404 when they may see none. */
  private async visible(
    actor: AuthUser,
  ): Promise<Prisma.CounsellingApplicationWhereInput> {
    const tenantId = this.access.tenantId;
    const tier = staffTierOf(actor);
    if (tier)
      return {
        tenantId,
        archivedAt: null,
        ...(tier === 'PASTOR' ? {} : { safeguardingFlaggedAt: null }),
      };
    if (!(await this.access.isCounsellor(actor))) throw notFound();
    return {
      tenantId,
      archivedAt: null,
      safeguardingFlaggedAt: null,
      Assignments: {
        some: { counsellorProfileId: actor.profileId!, active: true },
      },
    };
  }

  /** Counts only: no names or details on the summary cards. */
  async overview(actor: AuthUser) {
    const where = await this.visible(actor);
    const by = await this.prisma.counsellingApplication.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });
    const n = (...s: CounsellingStatus[]) =>
      by
        .filter((b) => s.includes(b.status))
        .reduce((t, b) => t + b._count._all, 0);
    const tier = staffTierOf(actor);
    const reviewable =
      tier === 'PASTOR'
        ? {}
        : tier
          ? { kind: 'PARENTAL_CONSENT' as const }
          : null;
    const [noLead, upcomingSessions, documentsAwaitingReview] = await Promise.all([
      this.prisma.counsellingApplication.count({
        where: {
          ...where,
          status: { in: ['ACCEPTED_FOR_COUNSELLING', 'IN_COUNSELLING'] },
          Assignments: { none: { active: true, isLead: true } },
        },
      }),
      this.prisma.counsellingSession.count({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: new Date(),
            lt: new Date(Date.now() + 14 * 86_400_000),
          },
          Application: where,
          ...(staffTierOf(actor)
            ? {}
            : { counsellorProfileId: actor.profileId! }),
        },
      }),
      reviewable
        ? this.prisma.counsellingDocumentRequirement.count({
            where: { status: 'UPLOADED', ...reviewable, Application: where },
          })
        : Promise.resolve(0),
    ]);
    return {
      total: by.reduce((t, b) => t + b._count._all, 0),
      new: n('SUBMITTED'),
      awaitingReview: n('UNDER_REVIEW', 'FINAL_REVIEW'),
      inCounselling: n('ACCEPTED_FOR_COUNSELLING', 'IN_COUNSELLING'),
      upcomingSessions,
      needsAttention: n('ADDITIONAL_INFORMATION_REQUIRED') + noLead,
      completed: n('COMPLETED'),
      documentsAwaitingReview,
    };
  }

  async list(actor: AuthUser, rawQuery: unknown) {
    const q = parseSchema(listQuerySchema, rawQuery);
    const where: Prisma.CounsellingApplicationWhereInput = {
      AND: [
        await this.visible(actor),
        q.status ? { status: q.status } : {},
        q.counsellor
          ? {
              Assignments: {
                some: { counsellorProfileId: q.counsellor, active: true },
              },
            }
          : {},
        q.from || q.to
          ? {
              submittedAt: {
                ...(q.from ? { gte: lagosDayStart(q.from) } : {}),
                ...(q.to
                  ? { lt: new Date(lagosDayStart(q.to).getTime() + 86_400_000) }
                  : {}),
              },
            }
          : {},
        // Closed or archived cases that still hold stored document files.
        q.storedFiles === 'closed'
          ? {
              OR: [{ status: 'CLOSED' }, { archivedAt: { not: null } }],
              DocumentRequirements: {
                some: { Files: { some: { purgedAt: null } } },
              },
            }
          : {},
      ],
    };
    const rows = await this.prisma.counsellingApplication.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      take: q.take + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        referenceCode: true,
        applicantFirstName: true,
        applicantLastName: true,
        partnerFirstName: true,
        partnerLastName: true,
        applicantRole: true,
        status: true,
        submittedAt: true,
        weddingDate: true,
        safeguardingFlaggedAt: true,
        Assignments: {
          where: { active: true },
          select: { isLead: true, Counsellor: personName },
        },
      },
    });
    const page = rows.slice(0, q.take);
    return {
      items: page.map(({ Assignments, ...r }) => ({
        ...r,
        counsellors: Assignments.map((a) => ({
          name: nameOf(a.Counsellor),
          isLead: a.isLead,
        })),
      })),
      nextCursor: rows.length > q.take ? page[page.length - 1].id : null,
    };
  }

  /** One case in full, and what this person may do with it. Writes a READ audit event. */
  async detail(actor: AuthUser, id: string) {
    const { tier } = await this.access.open(actor, id);
    const tenantId = this.access.tenantId;
    const row = await this.prisma.counsellingApplication.findUniqueOrThrow({
      where: { id },
      include: {
        Member: { select: { id: true, firstName: true, lastName: true } },
        Assignments: {
          orderBy: { assignedAt: 'desc' },
          include: { Counsellor: personName },
        },
        Sessions: {
          orderBy: { scheduledAt: 'asc' },
          include: {
            Counsellor: personName,
            Module: { select: { id: true, title: true } },
          },
        },
        Progress: { select: { moduleId: true, completedAt: true } },
        StatusEvents: { orderBy: { createdAt: 'asc' } },
        WeddingApproval: true,
      },
    });
    await counsellingAudit(this.prisma, {
      tenantId,
      actor,
      action: 'COUNSELLING_READ',
      entity: 'CounsellingApplication',
      entityId: id,
    });

    const actorIds = [
      ...new Set(
        row.StatusEvents.map((e) => e.actorProfileId).filter(
          (p): p is string => !!p,
        ),
      ),
    ];
    const actors = actorIds.length
      ? await this.prisma.profile.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, ...personName.select },
        })
      : [];
    const actorName = new Map(actors.map((a) => [a.id, nameOf(a)]));
    const {
      submissionKey: _k,
      submissionHash: _h,
      tenantId: _t,
      Assignments,
      Sessions,
      StatusEvents,
      Member,
      ...app
    } = row;
    const isStaff = tier !== 'COUNSELLOR';

    return {
      ...app,
      adminNote: isStaff ? app.adminNote : undefined,
      member:
        isStaff && Member
          ? { id: Member.id, name: `${Member.firstName} ${Member.lastName}` }
          : null,
      assignments: Assignments.map((a) => ({
        id: a.id,
        counsellorProfileId: a.counsellorProfileId,
        name: nameOf(a.Counsellor),
        isLead: a.isLead,
        active: a.active,
        assignedAt: a.assignedAt,
        endedAt: a.endedAt,
      })),
      sessions: Sessions.map(({ Counsellor, Module, ...s }) => ({
        ...s,
        counsellorName: nameOf(Counsellor),
        module: Module,
      })),
      timeline: StatusEvents.map((e) => ({
        id: e.id,
        from: e.fromStatus,
        to: e.toStatus,
        reason: isStaff ? e.reason : null,
        at: e.createdAt,
        by: e.actorProfileId ? (actorName.get(e.actorProfileId) ?? null) : null,
      })),
      tier,
      can: this.capabilities(tier, app.status, actor.profileId, Assignments),
      documentsGate: await this.documentsGate(app.id, tier),
    };
  }

  /** The documents check on one status move, for the status panel. */
  private async documentsGate(applicationId: string, tier: CaseTier) {
    const settings = await this.documents.values();
    const verified = await this.prisma.counsellingDocumentRequirement.count({
      where: { tenantId: this.access.tenantId, applicationId, status: 'VERIFIED' },
    });
    return {
      status: settings.documentsRequiredBefore,
      satisfied: verified >= 3,
      canOverride: tier === 'PASTOR',
      reasons: tier === 'PASTOR' ? settings.overrideReasons : [],
    };
  }

  private capabilities(
    tier: CaseTier,
    status: CounsellingStatus,
    profileId: string | null,
    assignments: { counsellorProfileId: string; active: boolean }[],
  ) {
    const counselsIt = assignments.some(
      (a) => a.active && a.counsellorProfileId === profileId,
    );
    return {
      transitions: can(tier, 'triage') ? ALLOWED[status] : [],
      requestInfo: can(tier, 'triage') && status === 'UNDER_REVIEW',
      admin: can(tier, 'triage'),
      assign: can(tier, 'assign'),
      archive: can(tier, 'archive'),
      safeguarding: can(tier, 'safeguarding'),
      wedding:
        can(tier, 'wedding') &&
        (status === 'FINAL_REVIEW' || status === 'COMPLETED'),
      sessions: can(tier, 'triage') || (tier === 'COUNSELLOR' && counselsIt),
      progress: can(tier, 'triage') || (tier === 'COUNSELLOR' && counselsIt),
    };
  }
}
