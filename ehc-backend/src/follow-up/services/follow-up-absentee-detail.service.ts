import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AbsenteeDetail } from '../follow-up.types';

/**
 * For ABSENTEE entries, attaches which of the last 8 services each person missed
 * plus a risk category — computed fresh (not the looser existing at-risk endpoint,
 * which fabricates its numbers) so the Master List can show real missed dates.
 */
@Injectable()
export class FollowUpAbsenteeDetailService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async attach<T extends { sourceType: FollowUpSourceType; person: { id: string } }>(entries: T[]): Promise<T[]> {
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

    const detailByMember = new Map<string, AbsenteeDetail>();
    for (const memberId of memberIds) {
      const present = presentByMember.get(memberId) ?? new Set<string>();
      const missed = recentServices.filter((s) => !present.has(s.id));
      const everPresent = allTimeCountByMember.get(memberId) ?? 0;
      const missedLast3 = recentServices.length >= 3 && recentServices.slice(0, 3).every((s) => !present.has(s.id));
      const windowRate = recentServices.length > 0 ? (recentServices.length - missed.length) / recentServices.length : 1;

      let category: AbsenteeDetail['category'] = null;
      if (everPresent === 0) category = 'NEVER_ATTENDED';
      else if (missedLast3) category = 'CONSECUTIVE_ABSENCES';
      else if (windowRate < 0.5) category = 'BELOW_50_PERCENT';

      detailByMember.set(memberId, {
        category,
        missedServices: missed.map((s) => ({ id: s.id, name: s.name, scheduledAt: s.scheduledAt.toISOString() })),
        attendedCount: recentServices.length - missed.length,
        totalRecent: recentServices.length,
      });
    }

    return entries.map((e) => {
      if (e.sourceType !== FollowUpSourceType.ABSENTEE) return e;
      const detail = detailByMember.get(e.person.id);
      return detail ? { ...e, absenteeDetail: detail } : e;
    });
  }
}
