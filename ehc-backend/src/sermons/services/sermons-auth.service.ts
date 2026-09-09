import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';

const PASTOR_PLUS: Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

/** The one unit whose plain members get sermon-management access without the PASTOR role. */
const AUDIO_PRODUCTION_UNIT_NAME = 'Audio Production';

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
    if (!actor.memberId) return false;

    const unit = await this.prisma.unit.findFirst({
      where: { tenantId: this.tenantId, name: AUDIO_PRODUCTION_UNIT_NAME },
      select: { id: true },
    });
    if (!unit) return false;

    const membership = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, unitId: unit.id, memberId: actor.memberId },
      select: { id: true },
    });
    return !!membership;
  }

  async requireManage(actor: AuthUser): Promise<void> {
    if (!(await this.canManage(actor))) {
      throw new ForbiddenException('Only a Pastor or the Audio Production team can manage sermons');
    }
  }
}
