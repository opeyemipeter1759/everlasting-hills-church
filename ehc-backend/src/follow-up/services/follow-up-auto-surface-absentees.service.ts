import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';
import { FollowUpAutoAssignService } from './follow-up-auto-assign.service';
import { FollowUpNotifyService } from './follow-up-notify.service';

interface AbsenteeCandidate {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  UnitMember: { unitId: string }[];
}

@Injectable()
export class FollowUpAutoSurfaceAbsenteesService {
  private readonly logger = new Logger(FollowUpAutoSurfaceAbsenteesService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitLeaderLookup: FollowUpUnitLeaderLookupService,
    private readonly autoAssign: FollowUpAutoAssignService,
    private readonly notify: FollowUpNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Daily sweep: anyone who's missed all of the last 3 services. This is the
   * ongoing "at-risk" detector — deliberately narrow so it only ever surfaces
   * genuinely recent absence, not anyone who's ever skipped a Sunday. */
  async run(leaderCache: Map<string, string | null>, fallbackUnitId: string | null): Promise<number> {
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
        firstName: true,
        lastName: true,
        gender: true,
        AttendanceRecord: { where: { serviceId: { in: sundayIds } }, select: { present: true } },
        UnitMember: { select: { unitId: true } },
      },
    });

    const absentees = activeMembers.filter((m) => !m.AttendanceRecord.some((r) => r.present));
    return this.createEntries(absentees, leaderCache, fallbackUnitId);
  }

  /** On-demand backfill for one specific past service — e.g. when a leader picks
   * an older service in the Follow-Up filter and finds nothing there, because it
   * fell outside the daily sweep's 3-service window by the time anyone looked.
   * Unlike `run()`, this only requires absence from that one service, not all 3
   * most recent — it's reconstructing history for a chosen day, not detecting a
   * fresh at-risk pattern. */
  async backfillForService(serviceId: string, leaderCache: Map<string, string | null>, fallbackUnitId: string | null): Promise<number> {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId: this.tenantId }, select: { scheduledAt: true } });
    if (!service) return 0;

    const activeMembers = await this.prisma.member.findMany({
      where: { tenantId: this.tenantId, status: MemberStatus.ACTIVE, joinedAt: { lte: service.scheduledAt } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        AttendanceRecord: { where: { serviceId }, select: { present: true } },
        UnitMember: { select: { unitId: true } },
      },
    });

    const absentees = activeMembers.filter((m) => !m.AttendanceRecord.some((r) => r.present));
    return this.createEntries(absentees, leaderCache, fallbackUnitId);
  }

  private async createEntries(
    absentees: AbsenteeCandidate[],
    leaderCache: Map<string, string | null>,
    fallbackUnitId: string | null,
  ): Promise<number> {
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

        const leaderProfileId = await this.unitLeaderLookup.getUnitLeaderProfileId(unitId, leaderCache);
        if (!leaderProfileId) {
          this.logger.warn(`auto-surface: unit ${unitId} has no active leader, skipping absentee ${member.id}`);
          continue;
        }

        const assigneeId = await this.autoAssign.pickAssignee(unitId, member.gender);
        const created_ = await this.prisma.followUpEntry.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            unitId,
            sourceType: FollowUpSourceType.ABSENTEE,
            memberId: member.id,
            addedById: leaderProfileId,
            assigneeId,
            stage: assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
          },
        });
        if (assigneeId) {
          await this.notify.notifyAssigned(assigneeId, `${member.firstName} ${member.lastName}`.trim(), created_.id);
        }
        existingKeys.add(key);
        created += 1;
      }
    }
    return created;
  }
}
