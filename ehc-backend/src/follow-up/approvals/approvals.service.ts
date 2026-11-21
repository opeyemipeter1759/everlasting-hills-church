import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { OVERRIDE_ROLES, authorityFor, decidersFor, decidersForUnit, type Authority } from './approval-deciders';
import { FIRST_TIMER_ASSIGNMENT, ROUTING_REQUESTER, assignmentPayload } from './assignment-approval';
import { MEMBER_ACCOUNT } from './account-approval';
import { decideApprovalSchema, requestApprovalSchema } from './approvals.schema';
import type { ApprovalSubject } from './approval-kinds';
import type { ApprovalView, PendingDecision, QueueItem, SubjectApproval } from './approvals.types';
import { WORKFLOW_TX } from '../workflow-tx';

const QUEUE_LIMIT = 200;

/**
 * Generic approvals. A request is asked for (or raised by the system) and
 * decided by the unit's team leads at that moment: whoever holds its lead
 * assignment and the head of its department, any one of them (else the
 * admins). Admin kinds go to the admins. An admin may override, which is
 * flagged and audited. Each change commits with its outbox event, and a decision is a
 * conditional update, so two deciders (or one double tap) can never both win.
 */
@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);
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
    await this.raiseIntegration(input.visitorId, actor.profileId, input.note || null, (subject) => {
      if (!firstTimerIntegration.canRequest(actor, subject)) throw new ForbiddenException('Only their assignee or an admin can ask for approval');
    });
    return this.forSubject(actor, input.visitorId);
  }

  /**
   * A Fourth timer (a fourth visit, or put there by hand) is put forward for
   * integration by itself: the same request as Request approval, asked on
   * their assignee's behalf, so the team leads decide it as usual. Only ever
   * once per person: after any request (pending, approved or sent back for
   * changes) it is the team's call. Someone with nobody assigned yet is left
   * for when they are. Returns how many were raised.
   */
  async requestAtFourVisits(visitorIds?: string[]): Promise<number> {
    let raised = 0;
    for (let skip = 0; ; skip += 200) {
      const page = await this.pipeline.list({ status: 'FOURTH_TIMER', visitorIds, take: 200, skip });
      const ready = page.rows.filter((r) => r.assigneeId);
      const asked = new Set(
        (await this.prisma.approvalRequest.findMany({
          where: { tenantId: this.tenantId, kind: firstTimerIntegration.kind, subjectId: { in: ready.map((r) => r.visitorId) } },
          select: { subjectId: true },
        })).map((r) => r.subjectId),
      );
      for (const row of ready.filter((r) => !asked.has(r.visitorId))) {
        const assignee = await this.prisma.member.findFirst({ where: { id: row.assigneeId!, tenantId: this.tenantId }, select: { profileId: true } });
        if (!assignee) continue;
        try {
          await this.raiseIntegration(row.visitorId, assignee.profileId, row.statusOverride === 'FOURTH_TIMER' ? 'Set to Fourth timer' : `Came ${row.visits} times`);
          raised++;
        } catch (err) {
          // Not ready after all (opted out, already asked a moment ago): leave them to the team.
          if (!(err instanceof BadRequestException || err instanceof ConflictException || err instanceof NotFoundException)) throw err;
          this.logger.log(`Integration not raised for first-timer ${row.visitorId}: ${err.message}`);
        }
      }
      if (skip + 200 >= page.total) return raised;
    }
  }

  /** The integration request itself, for whoever asks (or is asked on behalf of). */
  private async raiseIntegration(visitorId: string, requesterId: string, note: string | null, check?: (subject: ApprovalSubject) => void) {
    const handler = firstTimerIntegration;
    const tenantId = this.tenantId;
    let eventId: string;
    try {
      eventId = await this.prisma.$transaction(async (tx) => {
        const subject = await handler.subject(tx, tenantId, visitorId);
        check?.(subject);
        if (subject.blocked) throw new BadRequestException(subject.blocked);
        const id = randomUUID();
        await tx.approvalRequest.create({
          data: { id, tenantId, kind: handler.kind, subjectType: handler.subjectType, subjectId: subject.subjectId, unitId: subject.unitId, requesterId, note },
        });
        await handler.onRequested(tx, { tenantId, subjectId: subject.subjectId, actorId: requesterId });
        const payload: ApprovalRequestedPayload = {
          approvalId: id, kind: handler.kind, visitorId: subject.subjectId, firstName: subject.firstName,
          unitId: subject.unitId, requesterId,
        };
        return this.outbox.record(tx, { tenantId, type: FollowUpEvent.ApprovalRequested, payload: { ...payload }, actorId: requesterId });
      }, WORKFLOW_TX);
    } catch (err) {
      // The partial unique index allows one pending request per subject.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Approval has already been asked for. It is waiting for a decision.');
      }
      throw err;
    }
    await this.outbox.dispatchNow([eventId]);
  }

  /** Approve, or ask for changes. Authority is read from the assignment rows inside the transaction. */
  async decide(actor: AuthUser, id: string, raw: unknown): Promise<SubjectApproval> {
    const input = parseSchema(decideApprovalSchema, raw);
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    const tenantId = this.tenantId;
    const note = input.note || null;

    const { eventIds, subjectId } = await this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({ where: { id, tenantId } });
      if (!request) throw new NotFoundException('Approval request not found');
      const handler = APPROVAL_KINDS[request.kind];
      if (!handler) throw new BadRequestException('Unknown kind of approval');

      const authority = await authorityFor(tx, tenantId, request, actor.profileId);
      if (!authority.allowed) throw new ForbiddenException(forbiddenMessage(authority));
      if (request.status !== ApprovalStatus.PENDING) throw new ConflictException('This request has already been decided');
      if (input.decision === 'CHANGES_REQUESTED' && handler.noteOnChanges && !note) throw new BadRequestException('Say what still needs to happen');

      // Exactly one row, or someone else got there first.
      const won = await tx.approvalRequest.updateMany({
        where: { id, tenantId, status: ApprovalStatus.PENDING },
        data: { status: input.decision, deciderId: actor.profileId, decidedAt: new Date(), decisionNote: note, adminOverride: authority.override },
      });
      if (won.count !== 1) throw new ConflictException('Someone else decided this request a moment ago');

      const followOn = await handler.onDecided(tx, {
        tenantId, request: { ...request, status: input.decision }, actorId: actor.profileId, decision: input.decision, note,
        assigneeId: input.assigneeId || null, outbox: this.outbox,
      });
      await tx.auditLog.create({
        data: {
          id: randomUUID(), tenantId, actorId: actor.userId,
          action: authority.override ? 'APPROVAL_ADMIN_OVERRIDE' : 'APPROVAL_DECIDED',
          entity: 'ApprovalRequest', entityId: id,
          before: { status: ApprovalStatus.PENDING },
          after: { status: input.decision, adminOverride: authority.override, deciderLevel: authority.level },
        },
      });
      if (!handler.announceDecision) return { eventIds: followOn, subjectId: request.subjectId };
      const payload: ApprovalDecidedPayload = {
        approvalId: id, kind: request.kind, visitorId: request.subjectId,
        firstName: await handler.firstName(tx, tenantId, request.subjectId),
        unitId: request.unitId, requesterId: request.requesterId, decision: input.decision, adminOverride: authority.override,
      };
      const recorded = await this.outbox.record(tx, { tenantId, type: FollowUpEvent.ApprovalDecided, payload: { ...payload }, actorId: actor.profileId });
      return { eventIds: [recorded, ...followOn], subjectId: request.subjectId };
    }, WORKFLOW_TX);
    await this.outbox.dispatchNow(eventIds);
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
      const deciders = await decidersFor(this.prisma, this.tenantId, latest);
      const names = deciders.level === 'ADMIN' ? [] : [...(await this.names(deciders.profileIds)).values()];
      const authority = await authorityFor(this.prisma, this.tenantId, latest, actor.profileId);
      Object.assign(result, { deciders: { level: deciders.level, names }, canDecide: authority.allowed, decideAsOverride: authority.override });
    }
    const [assignment, account] = await Promise.all([
      this.pendingDecision(actor, FIRST_TIMER_ASSIGNMENT, visitorId),
      this.pendingDecision(actor, MEMBER_ACCOUNT, visitorId),
    ]);
    return { ...result, assignment, account };
  }

  /** A request of this kind still waiting on this person, and whether the caller may decide it. */
  private async pendingDecision(actor: AuthUser, kind: string, visitorId: string): Promise<PendingDecision | null> {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { tenantId: this.tenantId, kind, subjectId: visitorId, status: ApprovalStatus.PENDING },
    });
    if (!request) return null;
    const [view] = await this.views([request]);
    const authority = await authorityFor(this.prisma, this.tenantId, request, actor.profileId);
    return { ...view, canDecide: authority.allowed, asOverride: authority.override };
  }

  /**
   * Whether this person decides first-timer approvals at all, for the menu: an
   * admin or pastor, or a team lead (unit lead or department head) of a unit that
   * takes first-timers (one with a routing rule, or with a request waiting). A
   * lead of any other unit does not see Approvals.
   */
  async access(actor: AuthUser): Promise<{ canDecide: boolean }> {
    if (actor.effectiveRoles.some((r) => OVERRIDE_ROLES.includes(r))) return { canDecide: true };
    if (!actor.profileId) return { canDecide: false };
    const [rules, pending] = await Promise.all([
      this.prisma.routingRule.findMany({ where: { tenantId: this.tenantId, active: true }, select: { unitId: true } }),
      this.prisma.approvalRequest.findMany({ where: { tenantId: this.tenantId, status: ApprovalStatus.PENDING }, select: { unitId: true }, distinct: ['unitId'] }),
    ]);
    for (const unitId of new Set([...rules, ...pending].map((r) => r.unitId))) {
      const deciders = await decidersForUnit(this.prisma, this.tenantId, unitId);
      if (deciders.level !== 'ADMIN' && deciders.profileIds.includes(actor.profileId)) return { canDecide: true };
    }
    return { canDecide: false };
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
    const keyOf = (p: { kind: string; unitId: string }) => `${p.kind}:${p.unitId}`;
    for (const p of pending) {
      if (!authority.has(keyOf(p))) authority.set(keyOf(p), await authorityFor(this.prisma, this.tenantId, p, actor.profileId));
    }
    const mine = pending.filter((p) => authority.get(keyOf(p))?.allowed);
    if (mine.length === 0) return [];

    const people = await this.pipeline.list({ visitorIds: mine.map((p) => p.subjectId), take: QUEUE_LIMIT });
    const byVisitor = new Map(people.rows.map((r) => [r.visitorId, r]));
    const views = await this.views(mine);
    // Archived forms drop out of every list, this one included.
    return views
      .map((v, i) => ({ ...v, asOverride: authority.get(keyOf(mine[i]))!.override, person: byVisitor.get(v.subjectId)! }))
      .filter((item) => !!item.person);
  }

  private async views(requests: ApprovalRequest[]): Promise<ApprovalView[]> {
    const profileIds = requests.flatMap((r) => [r.requesterId, r.deciderId]).filter((p): p is string => !!p);
    const proposedIds = requests.map((r) => assignmentPayload(r.payload)?.assigneeId).filter((m): m is string => !!m);
    const [names, units, proposed] = await Promise.all([
      this.names(profileIds),
      this.prisma.unit.findMany({ where: { id: { in: [...new Set(requests.map((r) => r.unitId))] } }, select: { id: true, name: true } }),
      proposedIds.length
        ? this.prisma.member.findMany({ where: { id: { in: [...new Set(proposedIds)] } }, select: { id: true, firstName: true, lastName: true } })
        : Promise.resolve([] as { id: string; firstName: string; lastName: string }[]),
    ]);
    const unitName = new Map(units.map((u) => [u.id, u.name]));
    const memberName = new Map(proposed.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim()]));
    return requests.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      subjectId: r.subjectId,
      unitId: r.unitId,
      unitName: unitName.get(r.unitId) ?? null,
      note: r.note,
      requesterName: r.requesterId === ROUTING_REQUESTER ? 'The routing rules' : (names.get(r.requesterId) ?? null),
      createdAt: r.createdAt.toISOString(),
      decidedAt: r.decidedAt?.toISOString() ?? null,
      deciderName: r.deciderId ? (names.get(r.deciderId) ?? null) : null,
      decisionNote: r.decisionNote,
      adminOverride: r.adminOverride,
      proposedAssignee: (() => {
        const memberId = assignmentPayload(r.payload)?.assigneeId;
        return memberId ? { memberId, name: memberName.get(memberId) ?? null } : null;
      })(),
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
  if (authority.level === 'ADMIN') return 'Only an admin can decide this one';
  return 'Only the team leads of this unit can decide this one';
}
