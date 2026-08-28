import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage, MemberStatus } from '@prisma/client';
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

function personName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

/** Adding entries to the Master List and (re)assigning them to a team member. */
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
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async create(actor: AuthUser, dto: CreateFollowUpEntryDto) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');

    const unitId = await this.auth.resolveActorUnitId(actor, dto.unitId);
    if (!this.auth.canLead(actor, unitId)) {
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
    }

    // Assignment happens the moment the entry is created — same gender as the
    // subject, whoever on the team has the lightest load — unless the caller
    // picked someone specific.
    const assigneeId = dto.assigneeId ?? (await this.autoAssign.pickAssignee(unitId, subjectGender));

    const entry = await this.prisma.followUpEntry.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        sourceType: dto.sourceType,
        memberId: dto.sourceType === FollowUpSourceType.ABSENTEE ? dto.memberId : null,
        visitorId: dto.sourceType === FollowUpSourceType.FIRST_TIMER ? dto.visitorId : null,
        addedById: actor.profileId,
        assigneeId,
        stage: assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
      },
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: 'CREATE',
      entity: 'FollowUpEntry',
      entityId: entry.id,
      actorId: actor.userId,
      after: { unitId, sourceType: dto.sourceType, assigneeId },
    });

    if (assigneeId) {
      await this.notify.notifyAssigned(assigneeId, subjectName, entry.id);
    }
    return this.mapper.mapEntry(entry, actor);
  }

  async assign(actor: AuthUser, id: string, dto: AssignFollowUpDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');

    // The assignee's own unit — not the entry's current unit — decides both who's
    // allowed to make this assignment and where the entry ends up. This is what
    // lets a leader claim someone from the shared "Follow-Up" pool into their team.
    const assigneeMembership = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, memberId: dto.assigneeId },
      select: { unitId: true },
    });
    if (!assigneeMembership) throw new BadRequestException('Assignee must belong to a unit');

    if (!this.auth.canLead(actor, assigneeMembership.unitId)) {
      throw new ForbiddenException('You can only assign to your own team');
    }

    const followUpUnit = await this.prisma.unit.findFirst({
      where: { tenantId: this.tenantId, name: 'Follow-Up' },
      select: { id: true },
    });
    if (entry.unitId !== assigneeMembership.unitId && entry.unitId !== followUpUnit?.id) {
      throw new ForbiddenException('This entry already belongs to a different team');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: {
        assigneeId: dto.assigneeId,
        unitId: assigneeMembership.unitId,
        stage: entry.stage === FollowUpStage.UNASSIGNED ? FollowUpStage.ASSIGNED : entry.stage,
      },
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: 'ASSIGN',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      before: { assigneeId: entry.assigneeId, unitId: entry.unitId },
      after: { assigneeId: dto.assigneeId, unitId: assigneeMembership.unitId },
    });

    const mapped = this.mapper.mapEntry(updated, actor);
    await this.notify.notifyAssigned(dto.assigneeId, mapped.person.name, id);
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

    const visitor = await this.prisma.visitor.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        serviceId: dto.serviceId ?? null,
        attendanceType: 'In-Person',
      },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });

    const assigneeId = await this.autoAssign.pickAssignee(followUpUnitId, visitor.gender);
    const entry = await this.prisma.followUpEntry.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId: followUpUnitId,
        sourceType: FollowUpSourceType.FIRST_TIMER,
        visitorId: visitor.id,
        addedById: actor.profileId,
        assigneeId,
        stage: assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
      },
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: 'QUICK_CAPTURE',
      entity: 'FollowUpEntry',
      entityId: entry.id,
      actorId: actor.userId,
      after: { visitorId: visitor.id, assigneeId },
    });

    if (assigneeId) {
      await this.notify.notifyAssigned(assigneeId, personName(visitor), entry.id);
    }
    return this.mapper.mapEntry(entry, actor);
  }

  /** Moves a whole caseload at once — e.g. when a worker goes on leave. Only their
   * still-open entries within one unit; confirmed/opted-out entries stay put. */
  async bulkReassign(actor: AuthUser, dto: BulkReassignDto) {
    if (!this.auth.canLead(actor, dto.unitId)) {
      throw new ForbiddenException('You can only bulk-reassign within your own team');
    }
    const [fromMembership, toMembership] = await Promise.all([
      this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, unitId: dto.unitId, memberId: dto.fromAssigneeId } }),
      this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, unitId: dto.unitId, memberId: dto.toAssigneeId } }),
    ]);
    if (!fromMembership || !toMembership) {
      throw new BadRequestException('Both members must belong to this unit');
    }

    const result = await this.prisma.followUpEntry.updateMany({
      where: {
        tenantId: this.tenantId,
        unitId: dto.unitId,
        assigneeId: dto.fromAssigneeId,
        stage: { not: FollowUpStage.CONFIRMED },
        OR: [{ Member: null }, { Member: { status: { not: MemberStatus.OPTED_OUT } } }],
      },
      data: { assigneeId: dto.toAssigneeId },
    });

    await this.audit.write({
      action: 'BULK_REASSIGN',
      entity: 'FollowUpEntry',
      actorId: actor.userId,
      before: { assigneeId: dto.fromAssigneeId },
      after: { assigneeId: dto.toAssigneeId, count: result.count },
    });

    if (result.count > 0) {
      await this.notify.notifyAssigned(dto.toAssigneeId, `${result.count} follow-up${result.count === 1 ? '' : 's'}`);
    }
    return { reassigned: result.count };
  }
}
