import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { LogContactDto } from '../dto/log-contact.dto';
import type { ConfirmFollowUpDto } from '../dto/confirm-follow-up.dto';
import { ENTRY_INCLUDE, WORKING_STAGES } from '../follow-up.types';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpAuditService } from './follow-up-audit.service';

/** Logging contact attempts and final outcomes on a Master List entry. */
@Injectable()
export class FollowUpProgressService {
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

  async logContact(actor: AuthUser, id: string, dto: LogContactDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!actor.memberId || !this.auth.canWork(actor, entry)) {
      throw new ForbiddenException('You are not assigned to this follow-up');
    }
    if (entry.stage === FollowUpStage.CONFIRMED) {
      throw new BadRequestException('This follow-up already has a logged outcome');
    }

    await this.prisma.followUpContactLog.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        entryId: id,
        byId: actor.memberId,
        method: dto.method,
        outcome: dto.outcome,
        note: dto.note,
      },
    });

    const nextStage = WORKING_STAGES.includes(entry.stage) ? FollowUpStage.IN_PROGRESS : entry.stage;
    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { contactCount: { increment: 1 }, lastContactAt: new Date(), stage: nextStage },
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: 'LOG_CONTACT',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      after: { method: dto.method, outcome: dto.outcome },
    });
    return this.mapper.mapEntry(updated, actor);
  }

  /** Logs a final outcome (Became a Member, Returned, Not Interested, Unreachable).
   * Follow-up is a continuous, weekly-recurring effort — not a queue with a hand-off
   * step — so any team lead can log an outcome whenever they decide it's warranted,
   * from any stage, without the assignee first requesting review. */
  async confirm(actor: AuthUser, id: string, dto: ConfirmFollowUpDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!this.auth.canLead(actor, entry.unitId)) {
      throw new ForbiddenException('Only this unit\'s leader can log an outcome');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { stage: FollowUpStage.CONFIRMED, outcome: dto.outcome, reviewNote: dto.note ?? entry.reviewNote },
      include: ENTRY_INCLUDE,
    });
    await this.audit.write({
      action: 'CONFIRM',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      after: { outcome: dto.outcome },
    });
    return this.mapper.mapEntry(updated, actor);
  }
}
