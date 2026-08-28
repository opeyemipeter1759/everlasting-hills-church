import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpStage, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/**
 * Picks who a new FollowUpEntry gets assigned to the moment it's created —
 * same gender as the subject, whoever on that team currently has the lightest
 * open load. Falls back to the whole roster if no gender match exists, and to
 * `null` (entry stays UNASSIGNED, which already surfaces on the leader's list)
 * if the unit has nobody to assign at all.
 */
@Injectable()
export class FollowUpAutoAssignService {
  private readonly logger = new Logger(FollowUpAutoAssignService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async pickAssignee(unitId: string, subjectGender: string | null | undefined): Promise<string | null> {
    const roster = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, unitId, Member: { status: MemberStatus.ACTIVE } },
      select: { memberId: true, joinedAt: true, Member: { select: { gender: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    if (roster.length === 0) {
      this.logger.debug(`auto-assign: unit ${unitId} has no active members, leaving unassigned`);
      return null;
    }

    const genderMatched = subjectGender
      ? roster.filter((r) => (r.Member.gender ?? '').trim().toLowerCase() === subjectGender.trim().toLowerCase())
      : [];
    const pool = genderMatched.length > 0 ? genderMatched : roster;

    const loads = await this.prisma.followUpEntry.groupBy({
      by: ['assigneeId'],
      where: {
        tenantId: this.tenantId,
        assigneeId: { in: pool.map((p) => p.memberId) },
        stage: { not: FollowUpStage.CONFIRMED },
      },
      _count: { _all: true },
    });
    const loadByMember = new Map(loads.map((l) => [l.assigneeId as string, l._count._all]));

    let best = pool[0];
    let bestLoad = loadByMember.get(best.memberId) ?? 0;
    for (const candidate of pool.slice(1)) {
      const load = loadByMember.get(candidate.memberId) ?? 0;
      if (load < bestLoad) {
        best = candidate;
        bestLoad = load;
      }
    }
    return best.memberId;
  }
}
