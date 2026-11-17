import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage, MemberStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateFollowUpEntryDto } from '../dto/create-follow-up-entry.dto';
import type { AssignFollowUpDto } from '../dto/assign-follow-up.dto';
import type { QuickCaptureDto } from '../dto/quick-capture.dto';
import type { BulkReassignDto } from '../dto/bulk-reassign.dto';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpAuditService } from './follow-up-audit.service';
import { FollowUpAutoAssignService } from './follow-up-auto-assign.service';
import { FollowUpNotifyService } from './follow-up-notify.service';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';
import { FollowUpAssignableService } from './follow-up-assignable.service';
import { findFollowUpUnit, findIntegrationUnit } from '../follow-up-unit.util';
import { ADMIN_PLUS } from '../follow-up.types';
import { OutboxService } from '../../outbox/outbox.service';
import { assignEntry, pickAssignmentUnit } from '../routing/assignment';
import { FollowUpEvent, safeFirstName, type AssignedPayload } from '../events/follow-up-events';
import { WORKFLOW_TX } from '../workflow-tx';

/**
 * Adding entries to the Master List and (re)assigning them to a team member.
 * Every Follow Up assignment goes through `assignEntry`, which stamps when it
 * happened and its unit, cancels a pending approval and, for a first-timer,
 * records `first_timer.assigned` in the same transaction. A hand assignment
 * always wins over the routing rules: they only ever place new registrations.
 */
@Injectable()
export class FollowUpIntakeService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly audit: FollowUpAuditService,
    private readonly autoAssign: FollowUpAutoAssignService,
    private readonly notify: FollowUpNotifyService,
    private readonly unitLeaderLookup: FollowUpUnitLeaderLookupService,
    private readonly assignable: FollowUpAssignableService,
    config: ConfigService<Env, true>,
    private readonly outbox: OutboxService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async create(actor: AuthUser, dto: CreateFollowUpEntryDto) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');

    const unitId = await this.auth.resolveActorUnitId(actor, dto.unitId);
    if (!(await this.auth.canLeadUnit(actor, unitId))) {
      throw new ForbiddenException('Only this unit\'s leader can add to the Master List');
    }

    let subjectName = '';
    let subjectGender: string | null = null;
    if (dto.sourceType === FollowUpSourceType.FIRST_TIMER) {
      if (!dto.visitorId) throw new BadRequestException('visitorId is required for FIRST_TIMER');
      const visitor = await this.prisma.visitor.findFirst({
        where: { id: dto.visitorId, tenantId: this.tenantId },
        select: { id: true, firstName: true, lastName: true, gender: true },
      });
      if (!visitor) throw new NotFoundException('Visitor not found');
      subjectName = `${visitor.firstName} ${visitor.lastName}`.trim();
      subjectGender = visitor.gender;
    } else {
      if (!dto.memberId) throw new BadRequestException('memberId is required for ABSENTEE');
      const member = await this.prisma.member.findFirst({
        where: { id: dto.memberId, tenantId: this.tenantId },
        select: { id: true, firstName: true, lastName: true, gender: true },
      });
      if (!member) throw new NotFoundException('Member not found');
      subjectName = `${member.firstName} ${member.lastName}`.trim();
      subjectGender = member.gender;
    }

    if (dto.assigneeId) {
      const isMember = await this.prisma.unitMember.findFirst({
        where: { tenantId: this.tenantId, unitId, memberId: dto.assigneeId },
        select: { id: true },
      });
      if (!isMember) throw new BadRequestException('Assignee must be a member of this unit');
      if (await this.assignable.isSuperAdmin(dto.assigneeId)) {
        throw new BadRequestException('A Super Admin cannot be assigned follow-up work');
      }
    }

    // One entry per person, full stop — not per team. Without this, a leader
    // adding someone already auto-surfaced (or added by another team) creates
    // a second card for the same person with a second, independent assignee.
    const duplicate = await this.prisma.followUpEntry.findFirst({
      where: {
        tenantId: this.tenantId,
        ...(dto.sourceType === FollowUpSourceType.FIRST_TIMER
          ? { visitorId: dto.visitorId }
          : { memberId: dto.memberId }),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('This person already has a follow-up entry');
    }

    // Assignment happens the moment the entry is created — same gender as the
    // subject, whoever on the team has the lightest load — unless the caller
    // picked someone specific.
    const assigneeId = dto.assigneeId ?? (await this.autoAssign.pickAssignee(unitId, subjectGender));

    let entryId: string;
    let firstTimer = false;
    const eventIds: string[] = [];
    try {
      entryId = await this.prisma.$transaction(async (tx) => {
        const created = await tx.followUpEntry.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            unitId,
            sourceType: dto.sourceType,
            memberId: dto.sourceType === FollowUpSourceType.ABSENTEE ? dto.memberId : null,
            visitorId: dto.sourceType === FollowUpSourceType.FIRST_TIMER ? dto.visitorId : null,
            addedById: actor.profileId!,
            stage: FollowUpStage.UNASSIGNED,
          },
          select: { id: true },
        });
        if (assigneeId) {
          const result = await assignEntry(tx, this.outbox, {
            tenantId: this.tenantId, entryId: created.id, assigneeId, unitId, actorId: actor.profileId,
          });
          firstTimer = !!result.visitorId;
          if (result.eventId) eventIds.push(result.eventId);
        }
        return created.id;
      }, WORKFLOW_TX);
    } catch (err) {
      // Two leaders submitting the same person at nearly the same moment both
      // pass the check above — the DB's unique constraint is what actually
      // decides the race; this just turns the loser's error into the same
      // friendly message rather than a raw 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('This person already has a follow-up entry');
      }
      throw err;
    }
    await this.outbox.dispatchNow(eventIds);

    await this.audit.write({
      action: 'CREATE',
      entity: 'FollowUpEntry',
      entityId: entryId,
      actorId: actor.userId,
      after: { unitId, sourceType: dto.sourceType, assigneeId },
    });

    // A first-timer's assignee hears through the outbox; anyone else as before.
    if (assigneeId && !firstTimer) {
      await this.notify.notifyAssigned(assigneeId, subjectName, entryId);
    }
    const entry = await this.prisma.followUpEntry.findUniqueOrThrow({ where: { id: entryId }, include: ENTRY_INCLUDE });
    return this.mapper.mapEntry(entry, actor);
  }

  async assign(actor: AuthUser, id: string, dto: AssignFollowUpDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');

    // Super Admins run the system; follow-up work is never theirs to carry.
    if (await this.assignable.isSuperAdmin(dto.assigneeId)) {
      throw new BadRequestException('A Super Admin cannot be assigned follow-up work');
    }

    if (dto.team === 'INTEGRATION') return this.assignIntegration(actor, entry, dto.assigneeId);

    // One of the assignee's own units, not necessarily the entry's current one,
    // decides who may make this assignment and where the entry ends up. This is
    // what lets a leader claim someone from the shared "Follow-Up" pool into
    // their team. The unit is also whose lead decides an approval later.
    const memberships = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, memberId: dto.assigneeId },
      select: { unitId: true },
      orderBy: { joinedAt: 'asc' },
    });
    if (memberships.length === 0) throw new BadRequestException('Assignee must belong to a unit');

    const followUpUnit = await findFollowUpUnit(this.prisma, this.tenantId);
    const unitId = pickAssignmentUnit(
      memberships.map((m) => m.unitId),
      { requested: dto.unitId, current: entry.unitId, followUpUnitId: followUpUnit?.id },
    );
    if (!unitId) throw new BadRequestException('That person is not in the unit you picked');

    if (!(await this.auth.canLeadUnit(actor, unitId))) {
      throw new ForbiddenException('You can only assign to your own team');
    }

    // A team lead may claim from the shared pool or work within their own team;
    // an admin's hand assignment wins wherever the entry sits.
    const isAdmin = actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r));
    if (!isAdmin && entry.unitId !== unitId && entry.unitId !== followUpUnit?.id) {
      throw new ForbiddenException('This entry already belongs to a different team');
    }

    const result = await this.prisma.$transaction((tx) =>
      assignEntry(tx, this.outbox, {
        tenantId: this.tenantId, entryId: id, assigneeId: dto.assigneeId, unitId, actorId: actor.profileId,
      }),
      WORKFLOW_TX,
    );
    if (result.eventId) await this.outbox.dispatchNow([result.eventId]);

    await this.audit.write({
      action: 'ASSIGN',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      before: { assigneeId: entry.assigneeId, unitId: entry.unitId },
      after: { assigneeId: dto.assigneeId, unitId, cancelledApprovals: result.cancelledApprovals },
    });

    const updated = await this.prisma.followUpEntry.findUniqueOrThrow({ where: { id }, include: ENTRY_INCLUDE });
    const mapped = this.mapper.mapEntry(updated, actor);
    // A first-timer's assignee hears through the outbox; anyone else as before.
    if (result.changed && !result.visitorId) await this.notify.notifyAssigned(dto.assigneeId, mapped.person.name, id);
    return mapped;
  }

  /**
   * The Integration Team's own assignment: sets only integrationAssigneeId, so
   * Follow Up's assignee, the entry's unit and its stage are left exactly as
   * they were. The assignee must be on the Integration Team, and only its lead
   * (or their head of department, or church-wide staff) may assign.
   */
  private async assignIntegration(actor: AuthUser, entry: { id: string; integrationAssigneeId: string | null }, assigneeId: string) {
    const integrationUnit = await findIntegrationUnit(this.prisma, this.tenantId);
    if (!integrationUnit) throw new BadRequestException('There is no Integration Team unit to assign from');
    if (!(await this.auth.canLeadUnit(actor, integrationUnit.id))) {
      throw new ForbiddenException('Only the Integration Team lead can assign integration follow-up');
    }
    const onTeam = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, unitId: integrationUnit.id, memberId: assigneeId },
      select: { id: true },
    });
    if (!onTeam) throw new BadRequestException('The assignee must be on the Integration Team');

    const updated = await this.prisma.followUpEntry.update({
      where: { id: entry.id },
      data: { integrationAssigneeId: assigneeId },
      include: ENTRY_INCLUDE,
    });
    await this.audit.write({
      action: 'ASSIGN_INTEGRATION',
      entity: 'FollowUpEntry',
      entityId: entry.id,
      actorId: actor.userId,
      before: { integrationAssigneeId: entry.integrationAssigneeId },
      after: { integrationAssigneeId: assigneeId },
    });
    const mapped = this.mapper.mapEntry(updated, actor);
    await this.notify.notifyAssigned(assigneeId, mapped.person.name, entry.id);
    return mapped;
  }

  /** One-tap door capture: an usher (any MEMBER, not just a leader) creates a bare
   * name+phone Visitor and immediately routes them into the follow-up pipeline via
   * the same auto-assign path as everything else — the leader can flesh out the
   * rest of the intake form later. */
  async quickCapture(actor: AuthUser, dto: QuickCaptureDto) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');

    const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
    if (!followUpUnitId) throw new BadRequestException('No "Follow-Up" unit configured to route quick-captures into');

    // A door capture has no gender or student answer yet, so no routing rule
    // can match: it takes the Follow-Up unit's own auto-assign.
    const assigneeId = await this.autoAssign.pickAssignee(followUpUnitId, null);
    const eventIds: string[] = [];
    const { visitorId, entryId } = await this.prisma.$transaction(async (tx) => {
      const visitor = await tx.visitor.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          serviceId: dto.serviceId ?? null,
          attendanceType: 'In-Person',
        },
        select: { id: true, firstName: true },
      });
      const created = await tx.followUpEntry.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId: followUpUnitId,
          sourceType: FollowUpSourceType.FIRST_TIMER,
          visitorId: visitor.id,
          addedById: actor.profileId!,
          stage: FollowUpStage.UNASSIGNED,
        },
        select: { id: true },
      });
      if (assigneeId) {
        const result = await assignEntry(tx, this.outbox, {
          tenantId: this.tenantId, entryId: created.id, assigneeId, unitId: followUpUnitId, actorId: actor.profileId,
        });
        if (result.eventId) eventIds.push(result.eventId);
      }
      eventIds.push(
        await this.outbox.record(tx, {
          tenantId: this.tenantId,
          type: FollowUpEvent.Registered,
          payload: { visitorId: visitor.id, firstName: safeFirstName(visitor.firstName) },
          actorId: actor.profileId,
        }),
      );
      return { visitorId: visitor.id, entryId: created.id };
    }, WORKFLOW_TX);
    await this.outbox.dispatchNow(eventIds);

    await this.audit.write({
      action: 'QUICK_CAPTURE',
      entity: 'FollowUpEntry',
      entityId: entryId,
      actorId: actor.userId,
      after: { visitorId, assigneeId },
    });

    const entry = await this.prisma.followUpEntry.findUniqueOrThrow({ where: { id: entryId }, include: ENTRY_INCLUDE });
    return this.mapper.mapEntry(entry, actor);
  }

  /** Moves a whole caseload at once — e.g. when a worker goes on leave. Only their
   * still-open entries within one unit; confirmed/opted-out entries stay put. */
  async bulkReassign(actor: AuthUser, dto: BulkReassignDto) {
    if (!(await this.auth.canLeadUnit(actor, dto.unitId))) {
      throw new ForbiddenException('You can only bulk-reassign within your own team');
    }
    const [fromMembership, toMembership] = await Promise.all([
      this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, unitId: dto.unitId, memberId: dto.fromAssigneeId } }),
      this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, unitId: dto.unitId, memberId: dto.toAssigneeId } }),
    ]);
    if (!fromMembership || !toMembership) {
      throw new BadRequestException('Both members must belong to this unit');
    }
    if (await this.assignable.isSuperAdmin(dto.toAssigneeId)) {
      throw new BadRequestException('A Super Admin cannot be assigned follow-up work');
    }

    // Within the Integration Team, it is their own assignments that move —
    // wherever the entries sit, and never Follow Up's.
    const integrationUnit = await findIntegrationUnit(this.prisma, this.tenantId);
    if (integrationUnit && dto.unitId === integrationUnit.id) {
      const moved = await this.prisma.followUpEntry.updateMany({
        where: {
          tenantId: this.tenantId,
          integrationAssigneeId: dto.fromAssigneeId,
          OR: [{ Member: null }, { Member: { status: { not: MemberStatus.OPTED_OUT } } }],
        },
        data: { integrationAssigneeId: dto.toAssigneeId },
      });
      await this.audit.write({
        action: 'BULK_REASSIGN_INTEGRATION',
        entity: 'FollowUpEntry',
        actorId: actor.userId,
        before: { integrationAssigneeId: dto.fromAssigneeId },
        after: { integrationAssigneeId: dto.toAssigneeId, count: moved.count },
      });
      if (moved.count > 0) {
        await this.notify.notifyAssigned(dto.toAssigneeId, `${moved.count} integration follow-up${moved.count === 1 ? '' : 's'}`);
      }
      return { reassigned: moved.count };
    }

    // Still-open entries only: integrated and opted-out people stay with whoever had them.
    const open = await this.prisma.followUpEntry.findMany({
      where: {
        tenantId: this.tenantId,
        unitId: dto.unitId,
        assigneeId: dto.fromAssigneeId,
        stage: { notIn: [FollowUpStage.CONFIRMED, FollowUpStage.OPTED_OUT] },
        OR: [{ Member: null }, { Member: { status: { not: MemberStatus.OPTED_OUT } } }],
      },
      select: { id: true },
    });

    // Each move is a full assignment (time, unit, cancelled approvals), but the
    // new assignee is told once for the lot, not once per person.
    const eventIds: string[] = [];
    let others = 0;
    await this.prisma.$transaction(
      async (tx) => {
        const firstTimers: { visitorId: string; firstName: string | null; entryId: string }[] = [];
        for (const { id } of open) {
          const result = await assignEntry(tx, this.outbox, {
            tenantId: this.tenantId, entryId: id, assigneeId: dto.toAssigneeId, unitId: dto.unitId, actorId: actor.profileId, notify: false,
          });
          if (!result.changed) continue;
          if (result.visitorId) firstTimers.push({ visitorId: result.visitorId, firstName: result.firstName, entryId: id });
          else others += 1;
        }
        if (firstTimers.length === 0) return;
        const [one] = firstTimers;
        const payload: AssignedPayload =
          firstTimers.length === 1
            ? { assigneeMemberId: dto.toAssigneeId, visitorId: one.visitorId, firstName: one.firstName ?? undefined, entryId: one.entryId }
            : { assigneeMemberId: dto.toAssigneeId, count: firstTimers.length, unitId: dto.unitId };
        eventIds.push(
          await this.outbox.record(tx, {
            tenantId: this.tenantId, type: FollowUpEvent.Assigned, payload: { ...payload }, actorId: actor.profileId,
          }),
        );
      },
      { ...WORKFLOW_TX, timeout: 60_000 },
    );
    await this.outbox.dispatchNow(eventIds);

    await this.audit.write({
      action: 'BULK_REASSIGN',
      entity: 'FollowUpEntry',
      actorId: actor.userId,
      before: { assigneeId: dto.fromAssigneeId },
      after: { assigneeId: dto.toAssigneeId, count: open.length },
    });

    if (others > 0) {
      await this.notify.notifyAssigned(dto.toAssigneeId, `${others} follow-up${others === 1 ? '' : 's'}`);
    }
    return { reassigned: open.length };
  }
}
