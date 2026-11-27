import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { findFollowUpUnit, findIntegrationUnit } from '../follow-up-unit.util';
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

  /**
   * Who counts as this unit's leader: ADMIN+, the unit's own lead, or — when the
   * caller can tell us which department the unit sits in — the head of that
   * department. The app calls a department head an "Admin Head", but most of
   * them hold only the scoped HOD role, not a church-wide ADMIN_HEAD grant, so
   * without this they could see their own department's follow-ups and yet not
   * reassign a single one. Use `canLeadUnit()` when you only have a unit id.
   */
  canLead(actor: AuthUser, unitId: string, departmentId?: string | null): boolean {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return true;
    if (actor.unitLeadOf.includes(unitId)) return true;
    return !!departmentId && this.headsDepartment(actor, departmentId);
  }

  /**
   * On the Integration Team: a member of its unit, or someone who may lead it
   * (its lead, their head of department, church-wide staff).
   */
  async onIntegrationTeam(actor: AuthUser): Promise<boolean> {
    const unit = await findIntegrationUnit(this.prisma, this.tenantId);
    if (!unit) return actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r));
    if (await this.canLeadUnit(actor, unit.id)) return true;
    if (!actor.memberId) return false;
    const member = await this.prisma.unitMember.findFirst({ where: { tenantId: this.tenantId, unitId: unit.id, memberId: actor.memberId }, select: { id: true } });
    return !!member;
  }

  /** `canLead()` for call sites that don't already have the unit's department. */
  async canLeadUnit(actor: AuthUser, unitId: string): Promise<boolean> {
    if (this.canLead(actor, unitId)) return true;
    if (!actor.hodOf?.length) return false;
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      select: { departmentId: true },
    });
    return this.canLead(actor, unitId, unit?.departmentId);
  }

  canWork(
    actor: AuthUser,
    entry: { unitId: string; assigneeId: string | null; Unit?: { departmentId: string | null } | null },
  ): boolean {
    if (this.canLead(actor, entry.unitId, entry.Unit?.departmentId)) return true;
    return !!actor.memberId && entry.assigneeId === actor.memberId;
  }

  /** `canWork()` for call sites that don't already have the unit's department. */
  async canWorkEntry(actor: AuthUser, entry: { unitId: string; assigneeId: string | null }): Promise<boolean> {
    if (this.canWork(actor, entry)) return true;
    return this.canLeadUnit(actor, entry.unitId);
  }

  private headsDepartment(actor: AuthUser, departmentId: string): boolean {
    return !!actor.hodOf?.includes(departmentId);
  }

  /** Gate for the Follow-Up pipeline itself: a plain church member who isn't on any
   * team has no reason to see it. ADMIN+ always pass; everyone else must actually
   * belong to a unit (UnitMember) — being on a team, not a specific role level, is
   * what grants access. */
  async hasUnitAccess(actor: AuthUser): Promise<boolean> {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return true;
    // The first-timer contact reads the pipeline to send opening messages.
    if (actor.effectiveRoles.includes(Role.FIRST_TIMER_CONTACT)) return true;
    if (actor.unitLeadOf.length > 0) return true;
    if (actor.hodOf?.length) return true;
    if (!actor.memberId) return false;
    const membership = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, memberId: actor.memberId },
      select: { id: true },
    });
    return !!membership;
  }

  /**
   * Whose first-timers this person may read. The whole list goes to whoever
   * runs or feeds the work: admins, the first-timer contact, the Follow-Up
   * lead, heads of department, and the Integration Team (who work the
   * integrated). Everyone else, a Follow-Up team member included, sees only the
   * first-timers assigned to them. Returns null for the whole list, otherwise
   * the member id to pin the list to.
   */
  async firstTimerScope(actor: AuthUser): Promise<string | null> {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return null;
    if (actor.effectiveRoles.includes(Role.FIRST_TIMER_CONTACT)) return null;
    if (actor.hodOf?.length) return null;
    if (await this.resolveReportsUnit(actor)) return null;
    if (await this.onIntegrationTeam(actor)) return null;
    // No member record means nothing can be assigned to them: an id no one has.
    return actor.memberId ?? 'no-member';
  }

  /**
   * May correct a first-timer's record (name, phone, answers): a Follow-Up
   * team member for the first-timers assigned to them, and the Follow-Up lead,
   * heads of department and admins for anyone.
   */
  async canEditRecord(actor: AuthUser, assigneeId: string | null): Promise<boolean> {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return true;
    if (actor.hodOf?.length) return true;
    if (await this.resolveReportsUnit(actor)) return true;
    return !!actor.memberId && assigneeId === actor.memberId;
  }

  /** Same gate as hasUnitAccess, for routes that must refuse rather than report. */
  async requireAccess(actor: AuthUser): Promise<void> {
    if (!(await this.hasUnitAccess(actor))) {
      throw new ForbiddenException('Only the follow-up team can see this');
    }
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
      const followUpUnit = await findFollowUpUnit(this.prisma, this.tenantId);
      if (followUpUnit) return { id: followUpUnit.id, name: followUpUnit.name };
    }

    // A department head leads every unit in their department. Prefer Follow-Up
    // if it's one of them (it's the team this page is about), else the first.
    if (actor.hodOf?.length) {
      const unit = await this.prisma.unit.findFirst({
        where: { tenantId: this.tenantId, departmentId: { in: actor.hodOf } },
        orderBy: [{ name: 'asc' }],
        select: { id: true, name: true },
      });
      const followUpUnit = await findFollowUpUnit(this.prisma, this.tenantId, {
        departmentId: { in: actor.hodOf },
      });
      const preferred = followUpUnit ? { id: followUpUnit.id, name: followUpUnit.name } : unit;
      if (preferred) return preferred;
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
    const followUpUnit = await findFollowUpUnit(this.prisma, this.tenantId);
    if (!followUpUnit) return null;

    const { departmentId, ...unit } = followUpUnit;
    return this.canLead(actor, unit.id, departmentId) ? unit : null;
  }

  /** Resolves the unit to operate on and authorizes the actor for it in one pass.
   * With no `requestedUnitId`, resolves to the actor's own unit membership. With one,
   * admins/leaders of that unit pass through; a plain member must actually belong to it. */
  async resolveActorUnitId(actor: AuthUser, requestedUnitId?: string): Promise<string> {
    if (requestedUnitId && (await this.canLeadUnit(actor, requestedUnitId))) return requestedUnitId;

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
