import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { countVisitorsOnRecord } from '../../visitors/visitors-on-record';
import { FollowUpRollService } from './follow-up-roll.service';
import { FollowUpNoteActivityService } from './follow-up-note-activity.service';
import type { MasterListStatus } from './master-list.util';
import { inScope } from './master-list-filter.util';
import { threadKey } from './note-activity.util';

export type StatusCounts = Record<MasterListStatus, number>;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface FollowUpCounts {
  /** Everyone on the roll the team is responsible for. */
  total: number;
  byStatus: StatusCounts;
  /**
   * On the caseload of whoever is asking, as the Follow Up board's Assigned to
   * me tab lists it — so without anyone integrated or opted out.
   */
  assignedToMe: number;
  /** The Integration Team's own caseload for whoever is asking — their Assigned to me. */
  integrationAssignedToMe: number;
  /** Nobody is carrying these yet. */
  unassigned: number;
  /** First timers on record — the same total the admin First Timers page shows. */
  visitors: number;
  /**
   * The Follow Up board's own list (everyone not yet integrated or opted out),
   * for the summary at the top of the page.
   */
  followUp: {
    /** Came to the church's notice in the last seven days. */
    newThisWeek: number;
    /** Nobody on Follow Up is carrying them yet. */
    unassigned: number;
    /** Nothing logged on their thread in the last seven days. */
    quiet: number;
  };
}

const EMPTY: StatusCounts = {
  FIRST_TIMER: 0,
  SECOND_TIMER: 0,
  THIRD_TIMER: 0,
  INTEGRATED: 0,
  AWAY: 0,
  OPTED_OUT: 0,
};

/**
 * The figures above the Master List, counted over the very same people the
 * table lists. Anything the team agrees — one status change or fifty at once —
 * lands in these totals the next time they are asked for, because both read
 * the roll the same way.
 */
@Injectable()
export class FollowUpCountsService {
  private readonly tenantId: string;

  constructor(
    private readonly roll: FollowUpRollService,
    private readonly activity: FollowUpNoteActivityService,
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async summary(actor: AuthUser, now = new Date()): Promise<FollowUpCounts> {
    const weekAgo = new Date(now.getTime() - WEEK_MS);
    const [everyone, active, visitors] = await Promise.all([
      this.roll.everyone(),
      this.activity.activeSince(weekAgo),
      countVisitorsOnRecord(this.prisma, this.tenantId),
    ]);
    const byStatus = { ...EMPTY };
    const followUp = { newThisWeek: 0, unassigned: 0, quiet: 0 };
    let assignedToMe = 0;
    let integrationAssignedToMe = 0;
    let unassigned = 0;

    for (const row of everyone) {
      byStatus[row.status] += 1;
      if (actor.memberId && row.integrationAssignedTo?.id === actor.memberId && inScope(row.status, 'INTEGRATION')) {
        integrationAssignedToMe += 1;
      }
      if (!row.assignedTo) unassigned += 1;
      else if (actor.memberId && row.assignedTo.id === actor.memberId && inScope(row.status, 'FOLLOW_UP')) assignedToMe += 1;

      if (inScope(row.status, 'FOLLOW_UP')) {
        if (new Date(row.since).getTime() >= weekAgo.getTime()) followUp.newThisWeek += 1;
        if (!row.assignedTo) followUp.unassigned += 1;
        if (!active.has(threadKey(row.kind, row.id))) followUp.quiet += 1;
      }
    }

    return { total: everyone.length, byStatus, assignedToMe, integrationAssignedToMe, unassigned, visitors, followUp };
  }
}
