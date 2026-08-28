import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpLogKind, FollowUpStage } from '@prisma/client';
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

    const kind = dto.kind ?? FollowUpLogKind.CONTACT;
    const isContact = kind === FollowUpLogKind.CONTACT;
    if (isContact && (!dto.method || !dto.outcome)) {
      throw new BadRequestException('method and outcome are required for a contact log');
    }

    await this.prisma.followUpContactLog.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        entryId: id,
        byId: actor.memberId,
        kind,
        method: isContact ? dto.method : null,
        outcome: isContact ? dto.outcome : null,
        note: dto.note,
        isPastoralContact: dto.isPastoralContact ?? false,
        isPrivate: dto.isPrivate ?? false,
      },
    });

    // A quick update is a note for whoever picks this up next — it shouldn't
    // pretend to be a real contact attempt, so it doesn't advance the stage or
    // count toward the goal.
    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: isContact
        ? {
            contactCount: { increment: 1 },
            lastContactAt: new Date(),
            stage: WORKING_STAGES.includes(entry.stage) ? FollowUpStage.IN_PROGRESS : entry.stage,
          }
        : {},
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: isContact ? 'LOG_CONTACT' : 'LOG_QUICK_UPDATE',
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

  /** "Call back later" — hides the entry from the default/Today views until
   * `until` passes. Pass a null/past date to un-snooze. */
  async snooze(actor: AuthUser, id: string, until: string | null) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!actor.memberId || !this.auth.canWork(actor, entry)) {
      throw new ForbiddenException('You are not assigned to this follow-up');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { snoozedUntil: until ? new Date(until) : null },
      include: ENTRY_INCLUDE,
    });
    return this.mapper.mapEntry(updated, actor);
  }
}
