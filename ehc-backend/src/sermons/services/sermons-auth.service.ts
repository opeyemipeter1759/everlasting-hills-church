import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { isAudioProductionUnitName } from '../../common/audio-production.util';

const PASTOR_PLUS: Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

/**
 * Sermon management is PASTOR+ by role, but the Audio (Post) Production team
 * runs sermons day to day, so every member of that unit — lead or not — gets
 * full Super Admin power over the whole Sermons section: core management
 * here, and the pastoral-only routes (analytics, subscribers, engagement,
 * featured sermon, publish-scheduled) because PageAccessGuard elevates the
 * unit to SUPER_ADMIN on /sermons requests. This check stays as the
 * service-level backstop for the core actions.
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
