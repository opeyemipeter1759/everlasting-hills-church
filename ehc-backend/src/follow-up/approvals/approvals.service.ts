import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApprovalRequest, ApprovalStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../../outbox/outbox.service';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { FollowUpEvent, type ApprovalDecidedPayload, type ApprovalRequestedPayload } from '../events/follow-up-events';
import { APPROVAL_KINDS, firstTimerIntegration } from './approval-kinds';
import { authorityFor, decidersForUnit, type Authority } from './approval-deciders';
import { decideApprovalSchema, requestApprovalSchema } from './approvals.schema';
import type { ApprovalView, QueueItem, SubjectApproval } from './approvals.types';
import { WORKFLOW_TX } from '../workflow-tx';

const QUEUE_LIMIT = 200;

/**
 * Generic approvals. A request is asked for by the assignee or an admin and
 * decided by whoever holds the unit's lead assignment at that moment (else its
 * department head, else the admins); an admin may override, which is flagged
 * and audited. Each change commits with its outbox event, and a decision is a
 * conditional update, so two deciders (or one double tap) can never both win.
 */
@Injectable()
export class ApprovalsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly pipeline: PipelineRepository,
    private readonly auth: FollowUpAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Ask for a first-timer to be integrated. Moves them to awaiting review and tells whoever decides. */
  async request(actor: AuthUser, raw: unknown): Promise<SubjectApproval> {
    const input = parseSchema(requestApprovalSchema, raw);
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    await this.auth.requireAccess(actor);
    const handler = firstTimerIntegration;
    const tenantId = this.tenantId;

    let eventId: string;
    try {
      eventId = await this.prisma.$transaction(async (tx) => {
        const subject = await handler.subject(tx, tenantId, input.visitorId);
        if (!handler.canRequest(actor, subject)) throw new ForbiddenException('Only their assignee or an admin can ask for approval');
        if (subject.blocked) throw new BadRequestException(subject.blocked);
        const id = randomUUID();
        await tx.approvalRequest.create({
          data: {
            id, tenantId, kind: handler.kind, subjectType: handler.subjectType, subjectId: subject.subjectId,
            unitId: subject.unitId, requesterId: actor.profileId!, note: input.note || null,
          },
        });
        await handler.onRequested(tx, { tenantId, subjectId: subject.subjectId, actorId: actor.profileId });
        const payload: ApprovalRequestedPayload = {
          approvalId: id, kind: handler.kind, visitorId: subject.subjectId, firstName: subject.firstName,
          unitId: subject.unitId, requesterId: actor.profileId!,
        };
        return this.outbox.record(tx, { tenantId, type: FollowUpEvent.ApprovalRequested, payload: { ...payload }, actorId: actor.profileId });
      }, WORKFLOW_TX);
    } catch (err) {
      // The partial unique index allows one pending request per subject.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Approval has already been asked for. It is waiting for a decision.');
      }
      throw err;
    }
    await this.outbox.dispatchNow([eventId]);
    return this.forSubject(actor, input.visitorId);
  }

  /** Approve, or ask for changes. Authority is read from the assignment rows inside the transaction. */
  async decide(actor: AuthUser, id: string, raw: unknown): Promise<SubjectApproval> {
    const input = parseSchema(decideApprovalSchema, raw);
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    const tenantId = this.tenantId;
    const note = input.note || null;

    const { eventId, subjectId } = await this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({ where: { id, tenantId } });
      if (!request) throw new NotFoundException('Approval request not found');
      const handler = APPROVAL_KINDS[request.kind];
      if (!handler) throw new BadRequestException('Unknown kind of approval');

      const authority = await authorityFor(tx, tenantId, request.unitId, actor.profileId);
      if (!authority.allowed) throw new ForbiddenException(forbiddenMessage(authority));
      if (request.status !== ApprovalStatus.PENDING) throw new ConflictException('This request has already been decided');

      // Exactly one row, or someone else got there first.
      const won = await tx.approvalRequest.updateMany({
        where: { id, tenantId, status: ApprovalStatus.PENDING },
        data: { status: input.decision, deciderId: actor.profileId, decidedAt: new Date(), decisionNote: note, adminOverride: authority.override },
      });
      if (won.count !== 1) throw new ConflictException('Someone else decided this request a moment ago');

      await handler.onDecided(tx, { tenantId, subjectId: request.subjectId, actorId: actor.profileId, decision: input.decision, note });
      await tx.auditLog.create({
        data: {
          id: randomUUID(), tenantId, actorId: actor.userId,
          action: authority.override ? 'APPROVAL_ADMIN_OVERRIDE' : 'APPROVAL_DECIDED',
          entity: 'ApprovalRequest', entityId: id,
          before: { status: ApprovalStatus.PENDING },
          after: { status: input.decision, adminOverride: authority.override, deciderLevel: authority.level },
        },
      });
      const payload: ApprovalDecidedPayload = {
        approvalId: id, kind: request.kind, visitorId: request.subjectId,
        firstName: await handler.firstName(tx, tenantId, request.subjectId),
        unitId: request.unitId, requesterId: request.requesterId, decision: input.decision, adminOverride: authority.override,
      };
      const recorded = await this.outbox.record(tx, { tenantId, type: FollowUpEvent.ApprovalDecided, payload: { ...payload }, actorId: actor.profileId });
      return { eventId: recorded, subjectId: request.subjectId };
    }, WORKFLOW_TX);
    await this.outbox.dispatchNow([eventId]);
    return this.forSubject(actor, subjectId);
  }

  /** The approval part of a first-timer's profile: the latest request, and what the caller may do. */
  async forSubject(actor: AuthUser, visitorId: string): Promise<SubjectApproval> {
    await this.auth.requireAccess(actor);
    const handler = firstTimerIntegration;
    const subject = await handler.subject(this.prisma, this.tenantId, visitorId);
    const latest = await this.prisma.approvalRequest.findFirst({
      where: { tenantId: this.tenantId, kind: handler.kind, subjectType: handler.subjectType, subjectId: visitorId },
      orderBy: { createdAt: 'desc' },
    });
    const pending = latest?.status === ApprovalStatus.PENDING;
    const result: SubjectApproval = {
      latest: latest ? (await this.views([latest]))[0] : null,
      canRequest: !pending && !subject.blocked && handler.canRequest(actor, subject),
      blocked: pending ? null : subject.blocked,
      deciders: null,
      canDecide: false,
      decideAsOverride: false,
    };
    if (pending && latest) {
      const deciders = await decidersForUnit(this.prisma, this.tenantId, latest.unitId);
      const names = deciders.level === 'ADMIN' ? [] : [...(await this.names(deciders.profileIds)).values()];
      const authority = await authorityFor(this.prisma, this.tenantId, latest.unitId, actor.profileId);
      Object.assign(result, { deciders: { level: deciders.level, names }, canDecide: authority.allowed, decideAsOverride: authority.override });
    }
    return result;
  }

  /** Pending requests the caller may decide, oldest first. Admins see every one, marked when it would be an override. */
  async queue(actor: AuthUser, unitId?: string): Promise<QueueItem[]> {
    if (!actor.profileId) return [];
    const pending = await this.prisma.approvalRequest.findMany({
      where: { tenantId: this.tenantId, status: ApprovalStatus.PENDING, ...(unitId ? { unitId } : {}) },
      orderBy: { createdAt: 'asc' },
      take: QUEUE_LIMIT,
    });
    const authority = new Map<string, Authority>();
    for (const u of new Set(pending.map((p) => p.unitId))) {
      authority.set(u, await authorityFor(this.prisma, this.tenantId, u, actor.profileId));
    }
    const mine = pending.filter((p) => authority.get(p.unitId)?.allowed);
    if (mine.length === 0) return [];

    const people = await this.pipeline.list({ visitorIds: mine.map((p) => p.subjectId), take: QUEUE_LIMIT });
    const byVisitor = new Map(people.rows.map((r) => [r.visitorId, r]));
    const views = await this.views(mine);
    // Archived forms drop out of every list, this one included.
    return views
      .map((v, i) => ({ ...v, asOverride: authority.get(mine[i].unitId)!.override, person: byVisitor.get(v.subjectId)! }))
      .filter((item) => !!item.person);
  }

  private async views(requests: ApprovalRequest[]): Promise<ApprovalView[]> {
    const profileIds = requests.flatMap((r) => [r.requesterId, r.deciderId]).filter((p): p is string => !!p);
    const [names, units] = await Promise.all([
      this.names(profileIds),
      this.prisma.unit.findMany({ where: { id: { in: [...new Set(requests.map((r) => r.unitId))] } }, select: { id: true, name: true } }),
    ]);
    const unitName = new Map(units.map((u) => [u.id, u.name]));
    return requests.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      subjectId: r.subjectId,
      unitId: r.unitId,
      unitName: unitName.get(r.unitId) ?? null,
      note: r.note,
      requesterName: names.get(r.requesterId) ?? null,
      createdAt: r.createdAt.toISOString(),
      decidedAt: r.decidedAt?.toISOString() ?? null,
      deciderName: r.deciderId ? (names.get(r.deciderId) ?? null) : null,
      decisionNote: r.decisionNote,
      adminOverride: r.adminOverride,
    }));
  }

  /** Staff names by profile id. */
  private async names(profileIds: string[]): Promise<Map<string, string>> {
    if (profileIds.length === 0) return new Map();
    const members = await this.prisma.member.findMany({
      where: { profileId: { in: [...new Set(profileIds)] } },
      select: { profileId: true, firstName: true, lastName: true },
    });
    return new Map(members.map((m) => [m.profileId, `${m.firstName} ${m.lastName}`.trim()]));
  }
}

function forbiddenMessage(authority: Authority): string {
  if (authority.level === 'LEAD') return 'Only the lead of this unit can decide this one';
  if (authority.level === 'HEAD') return 'This unit has no lead, so its department head decides';
  return 'Only an admin can decide this one';
}
