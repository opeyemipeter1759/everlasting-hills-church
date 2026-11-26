import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpSourceType } from '@prisma/client';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { firstTimerIntegration } from '../approvals/approval-kinds';

/** Statuses still being followed up: not integrated, opted out or away. */
const ACTIVE = ['FIRST_TIMER', 'SECOND_TIMER', 'THIRD_TIMER', 'FOURTH_TIMER'] as const;

/** The first instant of this month in Lagos (UTC+1 all year). */
export function lagosMonthStart(now = new Date()): Date {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), 1) - 60 * 60 * 1000);
}

/**
 * One team member's own follow-up, for their Overview: the people given to
 * them, and what they have done about it. Counts only, nothing pastoral.
 */
@Injectable()
export class MyFollowUpService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineRepository,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async activity(actor: AuthUser, now = new Date()) {
    const memberId = actor.memberId;
    if (!memberId) throw new BadRequestException('No member record linked to this account');
    const since = lagosMonthStart(now);
    const mine = { tenantId: this.tenantId, byId: memberId, kind: 'CONTACT' as const, Entry: { sourceType: FollowUpSourceType.FIRST_TIMER } };

    const [assigned, waiting, contactsAll, contactsMonth, reachedMonth, firstContactsMonth, asked] = await Promise.all([
      this.pipeline.list({ assigneeId: memberId, take: 1 }),
      this.pipeline.list({ assigneeId: memberId, notContacted: true, take: 1 }),
      this.prisma.followUpContactLog.count({ where: mine }),
      this.prisma.followUpContactLog.groupBy({ by: ['method'], where: { ...mine, createdAt: { gte: since } }, _count: { _all: true } }),
      this.prisma.followUpContactLog.count({ where: { ...mine, createdAt: { gte: since }, outcome: 'REACHED' } }),
      this.prisma.followUpEntry.count({
        where: { tenantId: this.tenantId, assigneeId: memberId, sourceType: FollowUpSourceType.FIRST_TIMER, firstContactedAt: { gte: since } },
      }),
      actor.profileId
        ? this.prisma.approvalRequest.groupBy({
            by: ['status'],
            where: { tenantId: this.tenantId, kind: firstTimerIntegration.kind, requesterId: actor.profileId },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const counts = assigned.counts;
    const active = ACTIVE.reduce((n, s) => n + counts[s], 0);
    const waitingActive = ACTIVE.reduce((n, s) => n + waiting.counts[s], 0);
    const byMethod = Object.fromEntries(contactsMonth.map((r) => [r.method ?? 'OTHER', r._count._all]));
    const requests = Object.fromEntries(asked.map((r) => [r.status, r._count._all]));

    return {
      month: since.toISOString(),
      assigned: { total: counts.all, active, counts },
      waitingFirstContact: waitingActive,
      contacts: {
        allTime: contactsAll,
        thisMonth: contactsMonth.reduce((n, r) => n + r._count._all, 0),
        reachedThisMonth: reachedMonth,
        byMethodThisMonth: byMethod as Record<string, number>,
      },
      firstContactsThisMonth: firstContactsMonth,
      integrationRequests: {
        pending: requests.PENDING ?? 0,
        approved: requests.APPROVED ?? 0,
        changesRequested: requests.CHANGES_REQUESTED ?? 0,
      },
    };
  }
}
