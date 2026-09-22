import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';

const PASTOR_PLUS: Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

/**
 * Whether a unit is Audio Production — the one unit whose members get
 * sermon-management access without the PASTOR role. Unit names are typed by
 * admins, so an exact 'Audio Production' match locked the whole team out the
 * moment it was named "Audio production" or "Audio Production Unit". Case,
 * spacing and punctuation are ignored. Keep in step with the website's
 * isAudioProductionUnitName (everlasting-hills-church/lib/audio-production.ts).
 */
export function isAudioProductionUnitName(name: string): boolean {
  return name.toLowerCase().replace(/[^a-z]/g, '').includes('audioproduction');
}

/**
 * Core sermon management (list, view, upload, edit, delete) is PASTOR+ by
 * default, but the Audio Production team handles day-to-day uploads — so a
 * plain member of that one unit gets the same access to those core actions,
 * without needing the PASTOR role itself. Pastoral-only actions (analytics,
 * subscribers, engagement detail, featured sermon, publish-scheduled) stay
 * gated to PASTOR+ directly on their own routes and don't go through this
 * check — same "coarse @Roles at the controller, fine-grained check in a
 * service" split used by FollowUpAuthService.
 */
@Injectable()
export class SermonsAuthService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async canManage(actor: AuthUser): Promise<boolean> {
    if (actor.effectiveRoles.some((r) => PASTOR_PLUS.includes(r))) return true;
    // The person's own units — as a member (leads included, via isLead) or as
    // a lead recorded on their session — checked by name in code.
    const or: Prisma.UnitWhereInput[] = [];
    if (actor.memberId) or.push({ UnitMember: { some: { memberId: actor.memberId } } });
    if (actor.unitLeadOf.length) or.push({ id: { in: actor.unitLeadOf } });
    if (or.length === 0) return false;

    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId, OR: or },
      select: { name: true },
    });
    return units.some((unit) => isAudioProductionUnitName(unit.name));
  }

  async requireManage(actor: AuthUser): Promise<void> {
    if (!(await this.canManage(actor))) {
      throw new ForbiddenException('Only a Pastor or the Audio Production team can manage sermons');
    }
  }
}
