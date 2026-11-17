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
 * apart from the prayer request, and may edit; archiving stays with admins.
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

  async allowed(actor: AuthUser): Promise<boolean> {
    if (actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r))) return true;
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId, name: { contains: 'first', mode: 'insensitive' } },
      select: { id: true, name: true, departmentId: true },
    });
    const team = units.filter((u) => isFirstTimerTeamUnitName(u.name));
    if (team.length === 0) return false;
    const unitIds = team.map((u) => u.id);
    const departmentIds = team.map((u) => u.departmentId).filter((d): d is string => !!d);

    if (actor.unitLeadOf?.some((id) => unitIds.includes(id))) return true;
    if (actor.hodOf?.some((id) => departmentIds.includes(id))) return true;
    if (actor.memberId) {
      const member = await this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, memberId: actor.memberId, unitId: { in: unitIds } }, select: { id: true } });
      if (member) return true;
    }
    if (actor.profileId && departmentIds.length) {
      const head = await this.prisma.departmentHead.findFirst({
        where: { tenantId: this.tenantId, userId: actor.profileId, departmentId: { in: departmentIds }, endedAt: null },
        select: { id: true },
      });
      if (head) return true;
    }
    return false;
  }

  async require(actor: AuthUser): Promise<void> {
    if (!(await this.allowed(actor))) throw new ForbiddenException('Only the First Timer Team can see this');
  }
}

/** A first-timer record without the prayer request, which the team does not see. */
export function withoutPrayer<T extends { prayerPoint?: unknown }>(row: T): Omit<T, 'prayerPoint'> {
  const { prayerPoint: _prayer, ...rest } = row;
  void _prayer;
  return rest;
}
