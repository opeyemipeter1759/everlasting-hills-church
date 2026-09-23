import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { fetchMemberRows, fetchVisitorRows } from './master-list-queries';
import { FollowUpStatusService } from './follow-up-status.service';
import { settle, type RollRow } from './roll-settle.util';

/** A church roll is hundreds, not millions — it is read in one go. */
const MAX_SCAN = 2000;

function nameSearch(search: string) {
  return search
    ? {
        OR: [
          { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};
}

/**
 * Everyone the church is responsible for, with the status each of them
 * actually reads as: first-timers nobody has created an account for yet, then
 * every member, with any status the team has agreed on beating the one worked
 * out from attendance.
 *
 * The Master List and the figures above it both come from here, so a card can
 * never disagree with the table underneath it.
 */
export type { RollRow } from './roll-settle.util';

@Injectable()
export class FollowUpRollService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: FollowUpStatusService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async everyone(search = ''): Promise<RollRow[]> {
    const term = search.trim();
    // People who have left — transferred or deceased — are not followed up and
    // have no status here; someone who opted out stays, marked as such.
    const [visitors, members] = await Promise.all([
      fetchVisitorRows(
        this.prisma,
        { tenantId: this.tenantId, convertedAt: null, ...nameSearch(term) },
        MAX_SCAN,
        0,
      ),
      fetchMemberRows(
        this.prisma,
        {
          tenantId: this.tenantId,
          status: { in: [MemberStatus.ACTIVE, MemberStatus.INACTIVE, MemberStatus.OPTED_OUT] },
          ...nameSearch(term),
        },
        MAX_SCAN,
        0,
      ),
    ]);

    const [visitorAgreed, memberAgreed, visitorPending, memberPending] = await Promise.all([
      this.status.approvedFor('VISITOR', visitors.map((v) => v.id)),
      this.status.approvedFor('MEMBER', members.map((m) => m.id)),
      this.status.pendingFor('VISITOR', visitors.map((v) => v.id)),
      this.status.pendingFor('MEMBER', members.map((m) => m.id)),
    ]);

    return [
      ...settle(visitors, visitorAgreed, visitorPending),
      ...settle(members, memberAgreed, memberPending),
    ];
  }
}
