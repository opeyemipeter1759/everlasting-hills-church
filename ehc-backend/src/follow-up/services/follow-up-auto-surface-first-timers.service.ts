import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';
import { FollowUpAutoAssignService } from './follow-up-auto-assign.service';
import { FollowUpNotifyService } from './follow-up-notify.service';

interface VisitorCandidate {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
}

@Injectable()
export class FollowUpAutoSurfaceFirstTimersService {
  private readonly logger = new Logger(FollowUpAutoSurfaceFirstTimersService.name);
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

  async run(leaderCache: Map<string, string | null>, followUpUnitId: string | null): Promise<number> {
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });
    return this.createEntries(visitors, leaderCache, followUpUnitId);
  }

  /** On-demand backfill for one specific past service's still-unconverted
   * first-timers — covers the case where the daily sweep hadn't run yet (or
   * this church just turned the feature on) by the time someone looks for that
   * service day in the Follow-Up filter. */
  async backfillForService(serviceId: string, leaderCache: Map<string, string | null>, followUpUnitId: string | null): Promise<number> {
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null, serviceId },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });
    return this.createEntries(visitors, leaderCache, followUpUnitId);
  }

  private async createEntries(
    visitors: VisitorCandidate[],
    leaderCache: Map<string, string | null>,
    followUpUnitId: string,
  ): Promise<number> {
    if (visitors.length === 0) return 0;

    const leaderProfileId = await this.unitLeaderLookup.getUnitLeaderProfileId(followUpUnitId, leaderCache);
    if (!leaderProfileId) {
      this.logger.warn('auto-surface: "Follow-Up" unit has no active leader, skipping first-timer auto-create');
      return 0;
    }

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
      const assigneeId = await this.autoAssign.pickAssignee(followUpUnitId, visitor.gender);
      const entry = await this.prisma.followUpEntry.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId: followUpUnitId,
          sourceType: FollowUpSourceType.FIRST_TIMER,
          visitorId: visitor.id,
          addedById: leaderProfileId,
          assigneeId,
          stage: assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
        },
      });
      if (assigneeId) {
        await this.notify.notifyAssigned(assigneeId, `${visitor.firstName} ${visitor.lastName}`.trim(), entry.id);
      }
      created += 1;
    }
    return created;
  }
}
