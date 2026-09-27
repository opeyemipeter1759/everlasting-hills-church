import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/types/auth-user';
import { FollowUpRollService } from './follow-up-roll.service';
import type { MasterListStatus } from './master-list.util';
import { inScope } from './master-list-filter.util';

export type StatusCounts = Record<MasterListStatus, number>;

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
  constructor(private readonly roll: FollowUpRollService) {}

  async summary(actor: AuthUser): Promise<FollowUpCounts> {
    const everyone = await this.roll.everyone();
    const byStatus = { ...EMPTY };
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
    }

    return { total: everyone.length, byStatus, assignedToMe, integrationAssignedToMe, unassigned };
  }
}
