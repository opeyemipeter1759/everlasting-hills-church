import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpSourceType, FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { FollowUpNotifyService } from './follow-up-notify.service';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';

const HOUR = 60 * 60 * 1000;

/**
 * Daily sweep (run alongside the auto-surface job): nudges a worker once an
 * entry has gone quiet, escalates to the leader if it stays quiet, and prompts
 * a worker to close out an absentee who's clearly back. The 48h/5-day windows
 * are bounded (not "≥ 48h forever") so a once-daily cron fires each nudge once
 * near its threshold instead of repeating every day after.
 */
@Injectable()
export class FollowUpRemindersService {
  private readonly logger = new Logger(FollowUpRemindersService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: FollowUpNotifyService,
    private readonly unitLeaderLookup: FollowUpUnitLeaderLookupService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async run(): Promise<{ reminded: number; escalated: number; returnedPrompts: number }> {
    const [reminded, escalated, returnedPrompts] = await Promise.all([
      this.sweepWindow(48, 72, 'follow-up-reminder-48h', (name) => `Still waiting to hear from ${name} — it's been 2 days`),
      this.sweepEscalation(),
      this.promptReturned(),
    ]);
    return { reminded, escalated, returnedPrompts };
  }

  private baseWhere(fromHours: number, toHours: number) {
    const from = new Date(Date.now() - toHours * HOUR);
    const to = new Date(Date.now() - fromHours * HOUR);
    return {
      tenantId: this.tenantId,
      stage: { in: [FollowUpStage.ASSIGNED, FollowUpStage.IN_PROGRESS] },
      assigneeId: { not: null },
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: new Date() } }],
      AND: [
        {
          OR: [
            { lastContactAt: { gte: from, lt: to } },
            { lastContactAt: null, createdAt: { gte: from, lt: to } },
          ],
        },
      ],
    };
  }

  private async sweepWindow(fromHours: number, toHours: number, type: string, message: (name: string) => string): Promise<number> {
    const entries = await this.prisma.followUpEntry.findMany({
      where: this.baseWhere(fromHours, toHours),
      select: {
        id: true,
        assigneeId: true,
        Member: { select: { firstName: true, lastName: true, profileId: true } },
        Visitor: { select: { firstName: true, lastName: true } },
      },
    });

    for (const entry of entries) {
      if (!entry.assigneeId) continue;
      const subject = entry.Member ?? entry.Visitor;
      const name = subject ? `${subject.firstName} ${subject.lastName}`.trim() : 'this person';
      const member = await this.prisma.member.findUnique({ where: { id: entry.assigneeId }, select: { profileId: true } });
      if (!member) continue;
      await this.notify.notifyProfile(member.profileId, message(name), '', `/dashboard/follow-up?entry=${entry.id}`, type);
    }
    if (entries.length > 0) this.logger.log(`follow-up-reminders: sent ${entries.length} 48h reminders`);
    return entries.length;
  }

  private async sweepEscalation(): Promise<number> {
    const entries = await this.prisma.followUpEntry.findMany({
      where: this.baseWhere(120, 144),
      select: {
        id: true,
        unitId: true,
        assigneeId: true,
        Member: { select: { firstName: true, lastName: true } },
        Visitor: { select: { firstName: true, lastName: true } },
        Assignee: { select: { firstName: true, lastName: true } },
      },
    });

    const leaderCache = new Map<string, string | null>();
    let escalated = 0;
    for (const entry of entries) {
      const leaderProfileId = await this.unitLeaderLookup.getUnitLeaderProfileId(entry.unitId, leaderCache);
      if (!leaderProfileId) continue;
      const subject = entry.Member ?? entry.Visitor;
      const name = subject ? `${subject.firstName} ${subject.lastName}`.trim() : 'this person';
      const assigneeName = entry.Assignee ? `${entry.Assignee.firstName} ${entry.Assignee.lastName}`.trim() : 'the assignee';
      await this.notify.notifyProfile(
        leaderProfileId,
        `${name} still hasn't been reached after 5 days`,
        `Assigned to ${assigneeName}`,
        `/dashboard/follow-up?entry=${entry.id}`,
        'follow-up-escalation-5d',
      );
      escalated += 1;
    }
    if (escalated > 0) this.logger.log(`follow-up-reminders: escalated ${escalated} stale entries to their leaders`);
    return escalated;
  }

  /** An absentee entry whose subject now has 3 consecutive PRESENT records since
   * the entry was created — prompt the worker to confirm an outcome rather than
   * leaving it open indefinitely. Only fires once per entry (checked via a
   * matching in-app notification already existing). */
  private async promptReturned(): Promise<number> {
    const openAbsentees = await this.prisma.followUpEntry.findMany({
      where: { tenantId: this.tenantId, sourceType: FollowUpSourceType.ABSENTEE, stage: { not: FollowUpStage.CONFIRMED }, assigneeId: { not: null }, memberId: { not: null } },
      select: { id: true, memberId: true, assigneeId: true, createdAt: true, Member: { select: { firstName: true, lastName: true, profileId: true } } },
    });
    if (openAbsentees.length === 0) return 0;

    const recentServices = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: 3,
      select: { id: true },
    });
    if (recentServices.length < 3) return 0;
    const recentServiceIds = recentServices.map((s) => s.id);

    let prompted = 0;
    for (const entry of openAbsentees) {
      const presentCount = await this.prisma.attendanceRecord.count({
        where: { tenantId: this.tenantId, memberId: entry.memberId!, serviceId: { in: recentServiceIds }, present: true },
      });
      if (presentCount < 3) continue;

      const alreadyPrompted = await this.prisma.notification.findFirst({
        where: { tenantId: this.tenantId, type: 'follow-up-returned-prompt', link: `/dashboard/follow-up?entry=${entry.id}` },
        select: { id: true },
      });
      if (alreadyPrompted) continue;

      if (!entry.Member) continue;
      await this.notify.notifyProfile(
        entry.Member.profileId,
        `${entry.Member.firstName} is back — confirm an outcome?`,
        "They've attended the last 3 services running.",
        `/dashboard/follow-up?entry=${entry.id}`,
        'follow-up-returned-prompt',
      );
      prompted += 1;
    }
    if (prompted > 0) this.logger.log(`follow-up-reminders: prompted ${prompted} "they're back" confirmations`);
    return prompted;
  }
}
