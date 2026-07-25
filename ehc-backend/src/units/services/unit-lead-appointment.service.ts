import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { ADMIN_ROLES } from '../units.util';

/** Unit lead appointment/removal, delegated to Admin Heads within their departments. */
@Injectable()
export class UnitLeadAppointmentService {
  private readonly logger = new Logger(UnitLeadAppointmentService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Resolve who the actor is acting as when appointing a lead. PASTOR/ADMIN act
   * church-wide; an ADMIN_HEAD may act only on units in a department they head.
   * Returns the delegated attribution for the audit trail.
   */
  private appointAuthority(actor: AuthUser, departmentId: string | null): 'ADMIN' | 'ADMIN_HEAD' {
    if (actor.effectiveRoles?.some((r) => ADMIN_ROLES.includes(r))) return 'ADMIN';
    if (departmentId && actor.adminHeadOf?.includes(departmentId)) return 'ADMIN_HEAD';
    throw new ForbiddenException('You can only appoint leads for units in a department you head');
  }

  private async leadAudit(
    actor: AuthUser,
    action: string,
    unitId: string,
    after: Prisma.InputJsonValue,
    before?: Prisma.InputJsonValue,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(), tenantId: this.tenantId, actorId: actor.userId,
          action, entity: 'UnitLeadAssignment', entityId: unitId,
          before: before ?? Prisma.DbNull, after,
        },
      });
    } catch (err) {
      this.logger.error(`Audit write failed (${action}): ${(err as Error).message}`);
    }
  }

  /**
   * Appoint (or replace) a unit's lead. History-preserving: ends the current
   * active assignment and opens a new one, syncing the UnitMember.isLead pointer,
   * all in one transaction. Scope is enforced: an ADMIN_HEAD may only appoint within
   * a department they head.
   */
  async appointLead(actor: AuthUser, unitId: string, profileId: string) {
    if (!profileId) throw new BadRequestException('profileId is required');
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      select: { id: true, name: true, departmentId: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');

    const actedAs = this.appointAuthority(actor, unit.departmentId);

    const target = await this.prisma.profile.findFirst({
      where: { id: profileId, tenantId: this.tenantId },
      select: { id: true, Member: { select: { id: true } } },
    });
    if (!target) throw new NotFoundException('Person not found in this church');
    if (!target.Member) throw new BadRequestException('This person has no member record');
    const memberId = target.Member.id;

    const current = await this.prisma.unitLeadAssignment.findFirst({
      where: { unitId, endedAt: null },
      include: { User: { select: { Member: { select: { id: true } } } } },
    });
    if (current && current.userId === profileId) {
      return { unitId, leadProfileId: profileId, unchanged: true };
    }

    await this.prisma.$transaction(async (tx) => {
      if (current) {
        await tx.unitLeadAssignment.update({ where: { id: current.id }, data: { endedAt: new Date() } });
        const prevMemberId = current.User.Member?.id;
        if (prevMemberId) {
          await tx.unitMember.updateMany({ where: { unitId, memberId: prevMemberId }, data: { isLead: false } });
        }
      }
      await tx.unitLeadAssignment.create({
        data: { id: randomUUID(), tenantId: this.tenantId, unitId, userId: profileId, assignedById: actor.profileId ?? null },
      });
      // Sync the denormalized isLead pointer (ensure a membership row exists).
      const existing = await tx.unitMember.findFirst({ where: { unitId, memberId } });
      if (existing) {
        await tx.unitMember.update({ where: { id: existing.id }, data: { isLead: true } });
      } else {
        await tx.unitMember.create({
          data: { id: randomUUID(), tenantId: this.tenantId, unitId, memberId, isLead: true },
        });
      }
    });

    await this.leadAudit(
      actor, 'APPOINT_LEAD', unitId,
      { unitId, leadProfileId: profileId, actedAs },
      current ? { previousLeadProfileId: current.userId } : undefined,
    );
    if (current) this.effectiveRoles.invalidate(current.userId);
    this.effectiveRoles.invalidate(profileId);
    return { unitId, leadProfileId: profileId, actedAs };
  }

  /** End the current lead assignment for a unit (history-preserving). */
  async removeLead(actor: AuthUser, unitId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      select: { id: true, departmentId: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    const actedAs = this.appointAuthority(actor, unit.departmentId);

    const current = await this.prisma.unitLeadAssignment.findFirst({
      where: { unitId, endedAt: null },
      include: { User: { select: { Member: { select: { id: true } } } } },
    });
    if (!current) throw new BadRequestException('This unit has no active lead');

    await this.prisma.$transaction(async (tx) => {
      await tx.unitLeadAssignment.update({ where: { id: current.id }, data: { endedAt: new Date() } });
      const memberId = current.User.Member?.id;
      if (memberId) await tx.unitMember.updateMany({ where: { unitId, memberId }, data: { isLead: false } });
    });

    await this.leadAudit(actor, 'REMOVE_LEAD', unitId, { unitId, actedAs }, { leadProfileId: current.userId });
    this.effectiveRoles.invalidate(current.userId);
    return { unitId, removed: true, actedAs };
  }
}
