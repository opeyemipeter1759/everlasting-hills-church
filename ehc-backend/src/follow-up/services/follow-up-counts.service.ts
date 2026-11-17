import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import type { PipelineFilters, StatusCounts } from '../../pipeline/pipeline.types';
import { FollowUpNoteActivityService } from './follow-up-note-activity.service';

export type { StatusCounts } from '../../pipeline/pipeline.types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface FollowUpCounts {
  /** Everyone in the first-timer pipeline: the sum of byStatus. */
  total: number;
  byStatus: StatusCounts;
  /** First, second and third timers: the people still being followed up. */
  followingUp: number;
  /** Assigned to whoever is asking, whatever their status: what the Assigned to me tab lists. */
  assignedToMe: number;
  /** Still being followed up, with nobody assigned. */
  unassigned: number;
  /** First timers on record: the same total the admin First Timers page shows. */
  visitors: number;
  /** The summary at the top of the Follow Up page. */
  followUp: {
    /** First visit in the last seven days. */
    newThisWeek: number;
    /** Still being followed up, with nobody assigned. */
    unassigned: number;
    /** Still being followed up, with nothing logged on their thread in the last seven days. */
    quiet: number;
  };
}

/** The statuses that still need the team; integrated and opted out do not. */
const inFollowUp = (c: StatusCounts) => c.FIRST_TIMER + c.SECOND_TIMER + c.THIRD_TIMER;

/**
 * The figures on the Follow Up page, every one of them read from the pipeline
 * under the filter its list uses, so a badge or a card always equals the list
 * it opens. Nothing is counted here: each figure is the total, or a sum of the
 * counts, that the pipeline's SQL returned.
 */
@Injectable()
export class FollowUpCountsService {
  private readonly tenantId: string;

  constructor(
    private readonly pipeline: PipelineRepository,
    private readonly activity: FollowUpNoteActivityService,
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async summary(actor: AuthUser, now = new Date()): Promise<FollowUpCounts> {
    const [weekIds, activeIds] = await Promise.all([this.firstVisitedSince(now), this.activeSince(now)]);
    // Only the counts are wanted; a page of one row keeps each call cheap.
    const count = (filters: PipelineFilters) => this.pipeline.list({ ...filters, take: 1 });
    const [everyone, mine, nobody, fresh, active] = await Promise.all([
      count({}),
      actor.memberId ? count({ assigneeId: actor.memberId }) : null,
      count({ assigneeId: 'none' }),
      count({ visitorIds: weekIds }),
      count({ visitorIds: activeIds }),
    ]);

    const { all, ...byStatus } = everyone.counts;
    const unassigned = inFollowUp(nobody.counts);
    return {
      total: all,
      byStatus,
      followingUp: inFollowUp(byStatus),
      assignedToMe: mine?.total ?? 0,
      unassigned,
      visitors: all,
      followUp: {
        newThisWeek: fresh.total,
        unassigned,
        quiet: inFollowUp(byStatus) - inFollowUp(active.counts),
      },
    };
  }

  /** First-timer forms whose first visit was in the last seven days. */
  private async firstVisitedSince(now: Date): Promise<string[]> {
    const since = new Date(now.getTime() - WEEK_MS);
    const sinceDay = new Date(Math.floor(since.getTime() / DAY_MS) * DAY_MS);
    const rows = await this.prisma.visitor.findMany({
      where: {
        tenantId: this.tenantId,
        archivedAt: null,
        OR: [{ firstVisitDate: { gte: sinceDay } }, { firstVisitDate: null, submittedAt: { gte: since } }],
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  /**
   * First-timers with something logged on their thread in the last seven
   * days. A thread is keyed to the form, or to the account made from it.
   */
  private async activeSince(now: Date): Promise<string[]> {
    const keys = await this.activity.activeSince(new Date(now.getTime() - WEEK_MS));
    const visitorIds: string[] = [];
    const memberIds: string[] = [];
    for (const key of keys) {
      const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
      if (kind === 'VISITOR') visitorIds.push(id);
      else if (kind === 'MEMBER') memberIds.push(id);
    }
    if (memberIds.length === 0) return visitorIds;
    const forms = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedToMemberId: { in: memberIds } },
      select: { id: true },
    });
    return [...new Set([...visitorIds, ...forms.map((f) => f.id)])];
  }
}
