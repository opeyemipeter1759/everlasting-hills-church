import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { ADMIN_PLUS } from '../follow-up/follow-up.types';

/**
 * Whether a unit is the First Timer Team. Names are typed by admins ("First
 * Timer Team", "First-timers"), so case, spacing and punctuation are ignored.
 */
export function isFirstTimerTeamUnitName(name: string): boolean {
  return name.toLowerCase().replace(/[^a-z]/g, '').includes('firsttimer');
}

/**
 * Who works the first-timer records from the Membership and Assimilation side:
 * everyone in the First Timer Team, its lead, the head of its department, and
 * the church-wide admins. They see what the admin First Timers page shows,
 * apart from the prayer request. Only the team's lead, the head of its
 * department and the admins may edit a record (`canEdit`); the rest of the
 * team reads. Archiving stays with admins.
 */
@Injectable()
export class FirstTimerTeamAccess {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async team(): Promise<{ unitIds: string[]; departmentIds: string[] }> {
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId, name: { contains: 'first', mode: 'insensitive' } },
      select: { id: true, name: true, departmentId: true },
    });
    const team = units.filter((u) => isFirstTimerTeamUnitName(u.name));
    return { unitIds: team.map((u) => u.id), departmentIds: team.map((u) => u.departmentId).filter((d): d is string => !!d) };
  }

  /** The admins, the team's lead, or the head of its department. */
  private async leads(actor: AuthUser, unitIds: string[], departmentIds: string[]): Promise<boolean> {
    if (actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r))) return true;
    if (actor.unitLeadOf?.some((id) => unitIds.includes(id))) return true;
    if (actor.hodOf?.some((id) => departmentIds.includes(id))) return true;
    if (actor.profileId && departmentIds.length) {
      const head = await this.prisma.departmentHead.findFirst({
        where: { tenantId: this.tenantId, userId: actor.profileId, departmentId: { in: departmentIds }, endedAt: null },
        select: { id: true },
      });
      if (head) return true;
    }
    return false;
  }

  async allowed(actor: AuthUser): Promise<boolean> {
    if (actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r))) return true;
    const { unitIds, departmentIds } = await this.team();
    if (unitIds.length === 0) return false;
    if (await this.leads(actor, unitIds, departmentIds)) return true;
    if (actor.memberId) {
      const member = await this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, memberId: actor.memberId, unitId: { in: unitIds } }, select: { id: true } });
      if (member) return true;
    }
    return false;
  }

  /** May correct a first-timer record: the team's lead, the head of its department, or an admin. */
  async canEdit(actor: AuthUser): Promise<boolean> {
    if (actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r))) return true;
    const { unitIds, departmentIds } = await this.team();
    if (unitIds.length === 0) return false;
    return this.leads(actor, unitIds, departmentIds);
  }

  async require(actor: AuthUser): Promise<void> {
    if (!(await this.allowed(actor))) throw new ForbiddenException('Only the First Timer Team can see this');
  }

  async requireEdit(actor: AuthUser): Promise<void> {
    if (!(await this.canEdit(actor))) throw new ForbiddenException("Only the First Timer Team's lead can edit first-timer records");
  }
}

/** A first-timer record without the prayer request, which the team does not see. */
export function withoutPrayer<T extends { prayerPoint?: unknown }>(row: T): Omit<T, 'prayerPoint'> {
  const { prayerPoint: _prayer, ...rest } = row;
  void _prayer;
  return rest;
}
