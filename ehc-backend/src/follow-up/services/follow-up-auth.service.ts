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

  /**
   * The unit whose leader-only controls (Team roster, Bulk reassign, Service
   * report) this actor should see on the Follow-Up page.
   *
   * A real unit lead sees their own team, unchanged. ADMIN+/PASTOR/SUPER_ADMIN
   * already pass `canLead()` for every unit — including Follow-Up — but with
   * no team of their own they'd otherwise never see those controls at all,
   * since the page only renders them once it has a concrete unit to scope to.
   * Resolving that unit to "Follow-Up" here is what actually gives them the
   * same access a Follow-Up unit lead has, rather than authorization that
   * exists on the backend but nothing in the UI ever exposes.
   */
  async resolveMyUnit(actor: AuthUser): Promise<{ id: string; name: string } | null> {
    if (actor.unitLeadOf.length > 0) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: { in: actor.unitLeadOf }, tenantId: this.tenantId },
        select: { id: true, name: true },
      });
      if (unit) return unit;
    }

    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) {
      const followUpUnit = await this.prisma.unit.findFirst({
        where: { tenantId: this.tenantId, name: 'Follow-Up' },
        select: { id: true, name: true },
      });
      if (followUpUnit) return followUpUnit;
    }

    return null;
  }

  /**
   * The Follow-Up unit, if this actor is allowed to see its Service Reports —
   * specifically the Follow-Up unit's own lead, or PASTOR/ADMIN_HEAD/ADMIN/
   * SUPER_ADMIN. Deliberately narrower than `resolveMyUnit()`: a report is
   * about Follow-Up activity specifically, so a lead of some *other* team
   * (Ushering, Choir, Audio Production...) has no reason to see it just
   * because they lead a unit — unlike Team Roster/Bulk Reassign, which are
   * legitimately about "your own team", whichever one that is.
   */
  async resolveReportsUnit(actor: AuthUser): Promise<{ id: string; name: string } | null> {
    const followUpUnit = await this.prisma.unit.findFirst({
      where: { tenantId: this.tenantId, name: 'Follow-Up' },
      select: { id: true, name: true },
    });
    if (!followUpUnit) return null;

    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return followUpUnit;
    if (actor.unitLeadOf.includes(followUpUnit.id)) return followUpUnit;
    return null;
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
