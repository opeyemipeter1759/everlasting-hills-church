import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage, MemberStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import type { CreateFollowUpEntryDto } from './dto/create-follow-up-entry.dto';
import type { AssignFollowUpDto } from './dto/assign-follow-up.dto';
import type { LogContactDto } from './dto/log-contact.dto';
import type { ConfirmFollowUpDto } from './dto/confirm-follow-up.dto';
import type { RejectFollowUpDto } from './dto/reject-follow-up.dto';

const ADMIN_PLUS: Role[] = [Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN];

const WORKING_STAGES: FollowUpStage[] = [
  FollowUpStage.ASSIGNED,
  FollowUpStage.IN_PROGRESS,
  FollowUpStage.REOPENED,
];

const ENTRY_INCLUDE = {
  Unit: { select: { name: true } },
  Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true, email: true } },
  Visitor: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
  Assignee: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
  AddedBy: { select: { id: true, Member: { select: { firstName: true, lastName: true } } } },
  Logs: {
    orderBy: { createdAt: 'asc' as const },
    include: { By: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
  },
} satisfies Prisma.FollowUpEntryInclude;

type EntryWithRelations = Prisma.FollowUpEntryGetPayload<{ include: typeof ENTRY_INCLUDE }>;

/**
 * Follow-Up Pipeline: a unit's Master List of first-timers (Visitor) and absentees
 * (Member) tracked from first contact through a leader-confirmed close. Backs the
 * /dashboard/follow-up page. See prisma/manual/2026-07-follow-up.sql.
 */
@Injectable()
export class FollowUpService {
  private readonly logger = new Logger(FollowUpService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Authorization helpers ────────────────────────────────────────────────────

  private canLead(actor: AuthUser, unitId: string): boolean {
    if (actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r))) return true;
    return actor.unitLeadOf.includes(unitId);
  }

  private canWork(actor: AuthUser, entry: { unitId: string; assigneeId: string | null }): boolean {
    if (this.canLead(actor, entry.unitId)) return true;
    return !!actor.memberId && entry.assigneeId === actor.memberId;
  }

  /** Gate for the Follow-Up pipeline itself: a plain church member who isn't on any
   * team has no reason to see it. ADMIN+ always pass; everyone else must actually
   * belong to a unit (UnitMember) — being on a team, not a specific role level, is
   * what grants access. */
  private async hasUnitAccess(actor: AuthUser): Promise<boolean> {
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
  private async resolveActorUnitId(actor: AuthUser, requestedUnitId?: string): Promise<string> {
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

  // ── Read ──────────────────────────────────────────────────────────────────────
  // Visibility is intentionally church-wide: every authenticated unit member sees
  // the same Master List, the same totals, and the same contact logs — including
  // entries still awaiting review. The only thing that stays restricted is who can
  // *act* (assign, log, mark ready, confirm/reject), enforced per-entry below via
  // canLead/canWork and surfaced as viewerCanApprove/viewerCanWork.

  async list(actor: AuthUser, opts: { unitId?: string; stage?: FollowUpStage; mine?: boolean }) {
    if (!(await this.hasUnitAccess(actor))) {
      throw new ForbiddenException('You need to be part of a team to view the Follow-Up pipeline');
    }

    const entries = await this.prisma.followUpEntry.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.unitId ? { unitId: opts.unitId } : {}),
        ...(opts.stage ? { stage: opts.stage } : {}),
        ...(opts.mine && actor.memberId ? { assigneeId: actor.memberId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: ENTRY_INCLUDE,
    });
    return this.attachAbsenteeDetails(entries.map((e) => this.mapEntry(e, actor)));
  }

  async getOne(actor: AuthUser, id: string) {
    if (!(await this.hasUnitAccess(actor))) {
      throw new ForbiddenException('You need to be part of a team to view the Follow-Up pipeline');
    }

    const entry = await this.prisma.followUpEntry.findFirst({
      where: { id, tenantId: this.tenantId },
      include: ENTRY_INCLUDE,
    });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    const [detailed] = await this.attachAbsenteeDetails([this.mapEntry(entry, actor)]);
    return detailed;
  }

  // ── Write ─────────────────────────────────────────────────────────────────────

  async create(actor: AuthUser, dto: CreateFollowUpEntryDto) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');

    const unitId = await this.resolveActorUnitId(actor, dto.unitId);
    if (!this.canLead(actor, unitId)) {
      throw new ForbiddenException('Only this unit\'s leader can add to the Master List');
    }

    if (dto.sourceType === FollowUpSourceType.FIRST_TIMER) {
      if (!dto.visitorId) throw new BadRequestException('visitorId is required for FIRST_TIMER');
      const visitor = await this.prisma.visitor.findFirst({
        where: { id: dto.visitorId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!visitor) throw new NotFoundException('Visitor not found');
    } else {
      if (!dto.memberId) throw new BadRequestException('memberId is required for ABSENTEE');
      const member = await this.prisma.member.findFirst({
        where: { id: dto.memberId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!member) throw new NotFoundException('Member not found');
    }

    if (dto.assigneeId) {
      const isMember = await this.prisma.unitMember.findFirst({
        where: { tenantId: this.tenantId, unitId, memberId: dto.assigneeId },
        select: { id: true },
      });
      if (!isMember) throw new BadRequestException('Assignee must be a member of this unit');
    }

    const entry = await this.prisma.followUpEntry.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        sourceType: dto.sourceType,
        memberId: dto.sourceType === FollowUpSourceType.ABSENTEE ? dto.memberId : null,
        visitorId: dto.sourceType === FollowUpSourceType.FIRST_TIMER ? dto.visitorId : null,
        addedById: actor.profileId,
        assigneeId: dto.assigneeId ?? null,
        stage: dto.assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
      },
      include: ENTRY_INCLUDE,
    });

    await this.writeAudit({
      action: 'CREATE',
      entity: 'FollowUpEntry',
      entityId: entry.id,
      actorId: actor.userId,
      after: { unitId, sourceType: dto.sourceType, assigneeId: dto.assigneeId ?? null },
    });
    return this.mapEntry(entry, actor);
  }

  async assign(actor: AuthUser, id: string, dto: AssignFollowUpDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');

    // The assignee's own unit — not the entry's current unit — decides both who's
    // allowed to make this assignment and where the entry ends up. This is what
    // lets a leader claim someone from the shared "Follow-Up" pool into their team.
    const assigneeMembership = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, memberId: dto.assigneeId },
      select: { unitId: true },
    });
    if (!assigneeMembership) throw new BadRequestException('Assignee must belong to a unit');

    if (!this.canLead(actor, assigneeMembership.unitId)) {
      throw new ForbiddenException('You can only assign to your own team');
    }

    const followUpUnitId = await this.getFollowUpUnitId();
    if (entry.unitId !== assigneeMembership.unitId && entry.unitId !== followUpUnitId) {
      throw new ForbiddenException('This entry already belongs to a different team');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: {
        assigneeId: dto.assigneeId,
        unitId: assigneeMembership.unitId,
        stage: entry.stage === FollowUpStage.UNASSIGNED ? FollowUpStage.ASSIGNED : entry.stage,
      },
      include: ENTRY_INCLUDE,
    });

    await this.writeAudit({
      action: 'ASSIGN',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      before: { assigneeId: entry.assigneeId, unitId: entry.unitId },
      after: { assigneeId: dto.assigneeId, unitId: assigneeMembership.unitId },
    });
    return this.mapEntry(updated, actor);
  }

  async logContact(actor: AuthUser, id: string, dto: LogContactDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!actor.memberId || !this.canWork(actor, entry)) {
      throw new ForbiddenException('You are not assigned to this follow-up');
    }
    if (entry.stage === FollowUpStage.CONFIRMED || entry.stage === FollowUpStage.AWAITING_REVIEW) {
      throw new BadRequestException('This follow-up cannot be logged against from its current stage');
    }

    await this.prisma.followUpContactLog.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        entryId: id,
        byId: actor.memberId,
        method: dto.method,
        outcome: dto.outcome,
        note: dto.note,
      },
    });

    const nextStage = WORKING_STAGES.includes(entry.stage) ? FollowUpStage.IN_PROGRESS : entry.stage;
    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { contactCount: { increment: 1 }, lastContactAt: new Date(), stage: nextStage },
      include: ENTRY_INCLUDE,
    });

    await this.writeAudit({
      action: 'LOG_CONTACT',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      after: { method: dto.method, outcome: dto.outcome },
    });
    return this.mapEntry(updated, actor);
  }

  async markReady(actor: AuthUser, id: string) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!this.canWork(actor, entry)) {
      throw new ForbiddenException('You are not assigned to this follow-up');
    }
    if (!WORKING_STAGES.includes(entry.stage)) {
      throw new BadRequestException('This follow-up cannot be marked ready from its current stage');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { stage: FollowUpStage.AWAITING_REVIEW },
      include: ENTRY_INCLUDE,
    });
    await this.writeAudit({ action: 'MARK_READY', entity: 'FollowUpEntry', entityId: id, actorId: actor.userId });
    return this.mapEntry(updated, actor);
  }

  async confirm(actor: AuthUser, id: string, dto: ConfirmFollowUpDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!this.canLead(actor, entry.unitId)) {
      throw new ForbiddenException('Only this unit\'s leader can confirm');
    }
    if (entry.stage !== FollowUpStage.AWAITING_REVIEW) {
      throw new BadRequestException('Only entries awaiting review can be confirmed');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { stage: FollowUpStage.CONFIRMED, outcome: dto.outcome, reviewNote: dto.note ?? entry.reviewNote },
      include: ENTRY_INCLUDE,
    });
    await this.writeAudit({
      action: 'CONFIRM',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
      after: { outcome: dto.outcome },
    });
    return this.mapEntry(updated, actor);
  }

  async reject(actor: AuthUser, id: string, dto: RejectFollowUpDto) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!this.canLead(actor, entry.unitId)) {
      throw new ForbiddenException('Only this unit\'s leader can reopen a follow-up');
    }
    if (entry.stage !== FollowUpStage.AWAITING_REVIEW) {
      throw new BadRequestException('Only entries awaiting review can be reopened');
    }

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { stage: FollowUpStage.REOPENED, reviewNote: dto.note },
      include: ENTRY_INCLUDE,
    });
    await this.writeAudit({ action: 'REJECT', entity: 'FollowUpEntry', entityId: id, actorId: actor.userId, after: { note: dto.note } });
    return this.mapEntry(updated, actor);
  }

  // ── Auto-surface ──────────────────────────────────────────────────────────────
  // Daily job (see SchedulingService) + a manual ADMIN+ trigger. Creates entries for
  // every at-risk absentee — in every unit they belong to, or in the fallback
  // "Follow-Up" unit if they're not on any team — and every new visitor (always
  // routed to "Follow-Up", since visitors have no unit of their own). Once a
  // (unit, person) pair has ever had an entry, it is skipped permanently — no
  // re-creation, even after a CONFIRMED outcome.

  private async getUnitLeaderProfileId(unitId: string, cache: Map<string, string | null>): Promise<string | null> {
    if (cache.has(unitId)) return cache.get(unitId)!;
    const lead = await this.prisma.unitLeadAssignment.findFirst({
      where: { tenantId: this.tenantId, unitId, endedAt: null },
      select: { userId: true },
    });
    const profileId = lead?.userId ?? null;
    cache.set(unitId, profileId);
    return profileId;
  }

  private async getFollowUpUnitId(): Promise<string | null> {
    const unit = await this.prisma.unit.findFirst({
      where: { tenantId: this.tenantId, name: 'Follow-Up' },
      select: { id: true },
    });
    if (!unit) this.logger.warn('auto-surface: no unit named "Follow-Up" found — no fallback available');
    return unit?.id ?? null;
  }

  async autoSurfaceEntries(): Promise<{ absenteesCreated: number; firstTimersCreated: number }> {
    const leaderCache = new Map<string, string | null>();
    const followUpUnitId = await this.getFollowUpUnitId();
    const absenteesCreated = await this.autoSurfaceAbsentees(leaderCache, followUpUnitId);
    const firstTimersCreated = await this.autoSurfaceFirstTimers(leaderCache, followUpUnitId);
    return { absenteesCreated, firstTimersCreated };
  }

  private async autoSurfaceAbsentees(
    leaderCache: Map<string, string | null>,
    fallbackUnitId: string | null,
  ): Promise<number> {
    const sundays = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: 3,
    });
    if (sundays.length < 3) return 0;

    const sundayIds = sundays.map((s) => s.id);
    const oldestSunday = sundays[sundays.length - 1].scheduledAt;

    // Every at-risk church member — not just ones on a team. Members with no unit
    // fall back to the "Follow-Up" unit, same as new visitors.
    const activeMembers = await this.prisma.member.findMany({
      where: { tenantId: this.tenantId, status: MemberStatus.ACTIVE, joinedAt: { lte: oldestSunday } },
      select: {
        id: true,
        AttendanceRecord: { where: { serviceId: { in: sundayIds } }, select: { present: true } },
        UnitMember: { select: { unitId: true } },
      },
    });

    const absentees = activeMembers.filter((m) => !m.AttendanceRecord.some((r) => r.present));
    if (absentees.length === 0) return 0;

    const existing = await this.prisma.followUpEntry.findMany({
      where: {
        tenantId: this.tenantId,
        sourceType: FollowUpSourceType.ABSENTEE,
        memberId: { in: absentees.map((a) => a.id) },
      },
      select: { unitId: true, memberId: true },
    });
    const existingKeys = new Set(existing.map((e) => `${e.unitId}:${e.memberId}`));

    let created = 0;
    for (const member of absentees) {
      const targetUnitIds = member.UnitMember.length > 0
        ? member.UnitMember.map((um) => um.unitId)
        : fallbackUnitId
          ? [fallbackUnitId]
          : [];

      for (const unitId of targetUnitIds) {
        const key = `${unitId}:${member.id}`;
        if (existingKeys.has(key)) continue;

        const leaderProfileId = await this.getUnitLeaderProfileId(unitId, leaderCache);
        if (!leaderProfileId) {
          this.logger.warn(`auto-surface: unit ${unitId} has no active leader, skipping absentee ${member.id}`);
          continue;
        }

        await this.prisma.followUpEntry.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            unitId,
            sourceType: FollowUpSourceType.ABSENTEE,
            memberId: member.id,
            addedById: leaderProfileId,
            stage: FollowUpStage.UNASSIGNED,
          },
        });
        existingKeys.add(key);
        created += 1;
      }
    }
    return created;
  }

  private async autoSurfaceFirstTimers(
    leaderCache: Map<string, string | null>,
    followUpUnitId: string | null,
  ): Promise<number> {
    if (!followUpUnitId) return 0;

    const leaderProfileId = await this.getUnitLeaderProfileId(followUpUnitId, leaderCache);
    if (!leaderProfileId) {
      this.logger.warn('auto-surface: "Follow-Up" unit has no active leader, skipping first-timer auto-create');
      return 0;
    }

    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null },
      select: { id: true },
    });
    if (visitors.length === 0) return 0;

    const existing = await this.prisma.followUpEntry.findMany({
      where: {
        tenantId: this.tenantId,
        unitId: followUpUnitId,
        sourceType: FollowUpSourceType.FIRST_TIMER,
        visitorId: { in: visitors.map((v) => v.id) },
      },
      select: { visitorId: true },
    });
    const existingIds = new Set(existing.map((e) => e.visitorId));

    let created = 0;
    for (const visitor of visitors) {
      if (existingIds.has(visitor.id)) continue;
      await this.prisma.followUpEntry.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId: followUpUnitId,
          sourceType: FollowUpSourceType.FIRST_TIMER,
          visitorId: visitor.id,
          addedById: leaderProfileId,
          stage: FollowUpStage.UNASSIGNED,
        },
      });
      created += 1;
    }
    return created;
  }

  // ── Pickers ───────────────────────────────────────────────────────────────────

  async candidates(type: FollowUpSourceType, q: string) {
    const query = (q ?? '').trim();
    if (query.length < 2) return [];

    if (type === FollowUpSourceType.FIRST_TIMER) {
      const visitors = await this.prisma.visitor.findMany({
        where: {
          tenantId: this.tenantId,
          convertedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        orderBy: [{ firstName: 'asc' }],
        take: 15,
      });
      return visitors.map((v) => ({
        id: v.id,
        name: `${v.firstName} ${v.lastName}`.trim(),
        photoUrl: null as string | null,
        phone: v.phone,
        email: v.email,
      }));
    }

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        status: MemberStatus.ACTIVE,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, photoUrl: true },
      orderBy: [{ firstName: 'asc' }],
      take: 15,
    });
    return members.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`.trim(),
      photoUrl: m.photoUrl,
      phone: m.phone,
      email: m.email,
    }));
  }

  async team(actor: AuthUser, requestedUnitId?: string) {
    const unitId = await this.resolveActorUnitId(actor, requestedUnitId);
    const rows = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, unitId },
      include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
      orderBy: { Member: { firstName: 'asc' } },
    });
    return rows.map((r) => ({
      id: r.Member.id,
      name: `${r.Member.firstName} ${r.Member.lastName}`.trim(),
      photoUrl: r.Member.photoUrl,
      isLead: r.isLead,
    }));
  }

  // ── Mapping ───────────────────────────────────────────────────────────────────

  private mapEntry(entry: EntryWithRelations, actor: AuthUser) {
    const person = entry.Member
      ? {
          id: entry.Member.id,
          name: `${entry.Member.firstName} ${entry.Member.lastName}`.trim(),
          photoUrl: entry.Member.photoUrl,
          phone: entry.Member.phone,
          email: entry.Member.email,
        }
      : entry.Visitor
        ? {
            id: entry.Visitor.id,
            name: `${entry.Visitor.firstName} ${entry.Visitor.lastName}`.trim(),
            photoUrl: null as string | null,
            phone: entry.Visitor.phone,
            email: entry.Visitor.email,
          }
        : { id: '', name: 'Unknown', photoUrl: null, phone: null, email: null };

    const addedByMember = entry.AddedBy.Member;
    const addedBy = {
      id: entry.AddedBy.id,
      name: addedByMember ? `${addedByMember.firstName} ${addedByMember.lastName}`.trim() : 'Unknown',
      photoUrl: null as string | null,
    };

    return {
      id: entry.id,
      person,
      sourceType: entry.sourceType,
      unitId: entry.unitId,
      unitName: entry.Unit.name,
      addedBy,
      addedAt: entry.createdAt.toISOString(),
      assignee: entry.Assignee
        ? {
            id: entry.Assignee.id,
            name: `${entry.Assignee.firstName} ${entry.Assignee.lastName}`.trim(),
            photoUrl: entry.Assignee.photoUrl,
          }
        : null,
      stage: entry.stage,
      goalContacts: entry.goalContacts,
      contactCount: entry.contactCount,
      lastContactAt: entry.lastContactAt?.toISOString() ?? null,
      outcome: entry.outcome,
      reviewNote: entry.reviewNote,
      logs: entry.Logs.map((l) => ({
        id: l.id,
        by: { id: l.By.id, name: `${l.By.firstName} ${l.By.lastName}`.trim(), photoUrl: l.By.photoUrl },
        at: l.createdAt.toISOString(),
        method: l.method,
        outcome: l.outcome,
        note: l.note,
      })),
      absenteeDetail: null as {
        category: 'NEVER_ATTENDED' | 'CONSECUTIVE_ABSENCES' | 'BELOW_50_PERCENT' | null;
        missedServices: { id: string; name: string; scheduledAt: string }[];
      } | null,
      // Per-entry, not a blanket "is this user a leader somewhere" flag — a lead of
      // Production Team can now *see* a Follow-Up-unit entry via the shared pool,
      // but only Follow-Up's own leader (or ADMIN+) may assign/confirm/reject it.
      viewerCanApprove: this.canLead(actor, entry.unitId),
      viewerCanWork: this.canWork(actor, { unitId: entry.unitId, assigneeId: entry.assigneeId }),
    };
  }

  /** For ABSENTEE entries, attaches which of the last 8 services each person missed
   * plus a risk category — computed fresh (not the looser existing at-risk endpoint,
   * which fabricates its numbers) so the Master List can show real missed dates. */
  private async attachAbsenteeDetails<T extends { sourceType: FollowUpSourceType; person: { id: string } }>(
    entries: T[],
  ): Promise<T[]> {
    const memberIds = [...new Set(
      entries.filter((e) => e.sourceType === FollowUpSourceType.ABSENTEE).map((e) => e.person.id),
    )];
    if (memberIds.length === 0) return entries;

    const recentServices = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: 8,
      select: { id: true, name: true, scheduledAt: true },
    });
    const recentServiceIds = recentServices.map((s) => s.id);

    const [windowPresent, allTimePresent] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: { tenantId: this.tenantId, memberId: { in: memberIds }, serviceId: { in: recentServiceIds }, present: true },
        select: { memberId: true, serviceId: true },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['memberId'],
        where: { tenantId: this.tenantId, memberId: { in: memberIds }, present: true },
        _count: true,
      }),
    ]);

    const presentByMember = new Map<string, Set<string>>();
    for (const r of windowPresent) {
      if (!presentByMember.has(r.memberId)) presentByMember.set(r.memberId, new Set());
      presentByMember.get(r.memberId)!.add(r.serviceId);
    }
    const allTimeCountByMember = new Map(allTimePresent.map((a) => [a.memberId, a._count]));

    const detailByMember = new Map<string, { category: 'NEVER_ATTENDED' | 'CONSECUTIVE_ABSENCES' | 'BELOW_50_PERCENT' | null; missedServices: { id: string; name: string; scheduledAt: string }[] }>();
    for (const memberId of memberIds) {
      const present = presentByMember.get(memberId) ?? new Set<string>();
      const missed = recentServices.filter((s) => !present.has(s.id));
      const everPresent = allTimeCountByMember.get(memberId) ?? 0;
      const missedLast3 = recentServices.length >= 3 && recentServices.slice(0, 3).every((s) => !present.has(s.id));
      const windowRate = recentServices.length > 0 ? (recentServices.length - missed.length) / recentServices.length : 1;

      let category: 'NEVER_ATTENDED' | 'CONSECUTIVE_ABSENCES' | 'BELOW_50_PERCENT' | null = null;
      if (everPresent === 0) category = 'NEVER_ATTENDED';
      else if (missedLast3) category = 'CONSECUTIVE_ABSENCES';
      else if (windowRate < 0.5) category = 'BELOW_50_PERCENT';

      detailByMember.set(memberId, {
        category,
        missedServices: missed.map((s) => ({ id: s.id, name: s.name, scheduledAt: s.scheduledAt.toISOString() })),
      });
    }

    return entries.map((e) => {
      if (e.sourceType !== FollowUpSourceType.ABSENTEE) return e;
      const detail = detailByMember.get(e.person.id);
      return detail ? { ...e, absenteeDetail: detail } : e;
    });
  }

  private async writeAudit(entry: {
    action: string;
    entity: string;
    entityId?: string | null;
    actorId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          before: entry.before ?? Prisma.DbNull,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      this.logger.error(`Audit write failed (${entry.action} ${entry.entity}): ${(err as Error).message}`);
    }
  }
}
