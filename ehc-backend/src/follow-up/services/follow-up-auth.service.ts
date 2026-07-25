import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { ADMIN_PLUS } from '../follow-up.types';

/** Authorization + unit-resolution helpers shared across the Follow-Up pipeline. */
@Injectable()
export class FollowUpAuthService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  canLead(actor: AuthUser, unitId: string): boolean {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return true;
    return actor.unitLeadOf.includes(unitId);
  }

  canWork(actor: AuthUser, entry: { unitId: string; assigneeId: string | null }): boolean {
    if (this.canLead(actor, entry.unitId)) return true;
    return !!actor.memberId && entry.assigneeId === actor.memberId;
  }

  /** Gate for the Follow-Up pipeline itself: a plain church member who isn't on any
   * team has no reason to see it. ADMIN+ always pass; everyone else must actually
   * belong to a unit (UnitMember) — being on a team, not a specific role level, is
   * what grants access. */
  async hasUnitAccess(actor: AuthUser): Promise<boolean> {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return true;
    if (actor.unitLeadOf.length > 0) return true;
    if (!actor.memberId) return false;
    const membership = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, memberId: actor.memberId },
      select: { id: true },
    });
    return !!membership;
  }

  /** Public wrapper for the nav link's visibility check on the frontend. */
  async checkAccess(actor: AuthUser): Promise<{ hasAccess: boolean }> {
    return { hasAccess: await this.hasUnitAccess(actor) };
  }

  /** Resolves the unit to operate on and authorizes the actor for it in one pass.
   * With no `requestedUnitId`, resolves to the actor's own unit membership. With one,
   * admins/leaders of that unit pass through; a plain member must actually belong to it. */
  async resolveActorUnitId(actor: AuthUser, requestedUnitId?: string): Promise<string> {
    if (requestedUnitId && this.canLead(actor, requestedUnitId)) return requestedUnitId;

    if (!actor.memberId) throw new ForbiddenException('No member profile linked to this account');

    const membership = await this.prisma.unitMember.findFirst({
      where: {
        tenantId: this.tenantId,
        memberId: actor.memberId,
        ...(requestedUnitId ? { unitId: requestedUnitId } : {}),
      },
      select: { unitId: true },
    });

    if (!membership) {
      throw requestedUnitId
        ? new ForbiddenException('You are not a member of that unit')
        : new NotFoundException('You are not part of any unit yet');
    }
    return membership.unitId;
  }
}
