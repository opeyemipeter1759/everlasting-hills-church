import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateFollowUpEntryDto } from '../dto/create-follow-up-entry.dto';
import type { AssignFollowUpDto } from '../dto/assign-follow-up.dto';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpAuditService } from './follow-up-audit.service';

/** Adding entries to the Master List and (re)assigning them to a team member. */
@Injectable()
export class FollowUpIntakeService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly audit: FollowUpAuditService,
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

    if (dto.sourceType === FollowUpSourceType.FIRST_TIMER) {
      if (!dto.visitorId) throw new BadRequestException('visitorId is required for FIRST_TIMER');
      const visitor = await this.prisma.visitor.findFirst({
        where: { id: dto.visitorId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!visitor) throw new NotFoundException('Visitor not found');
    } else {
      if (!dto.memberId) throw new BadRequestException('memberId is required for ABSENTEE');
      const member = await this.prisma.member.findFirst({
        where: { id: dto.memberId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!member) throw new NotFoundException('Member not found');
    }

    if (dto.assigneeId) {
      const isMember = await this.prisma.unitMember.findFirst({
        where: { tenantId: this.tenantId, unitId, memberId: dto.assigneeId },
        select: { id: true },
      });
      if (!isMember) throw new BadRequestException('Assignee must be a member of this unit');
    }

    const entry = await this.prisma.followUpEntry.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        sourceType: dto.sourceType,
        memberId: dto.sourceType === FollowUpSourceType.ABSENTEE ? dto.memberId : null,
        visitorId: dto.sourceType === FollowUpSourceType.FIRST_TIMER ? dto.visitorId : null,
        addedById: actor.profileId,
        assigneeId: dto.assigneeId ?? null,
        stage: dto.assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
      },
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: 'CREATE',
      entity: 'FollowUpEntry',
      entityId: entry.id,
      actorId: actor.userId,
      after: { unitId, sourceType: dto.sourceType, assigneeId: dto.assigneeId ?? null },
    });
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
    return this.mapper.mapEntry(updated, actor);
  }
}
