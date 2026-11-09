import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { ACTIVE_MEMBER, activeMembersOf } from '../../members/active-members';
import { watDateStr } from '../attendance-list.util';

/**
 * The overview at the top of the admin Attendance page: the most recent
 * services, newest first, each with the ushers' headcount (everyone in the
 * room, children included) beside the active members who checked in on the
 * app. The two never mix: the headcount is the congregation, check-ins are
 * the per-member roll (see headcount/).
 */
@Injectable()
export class AttendanceServiceOverviewService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async recentServices(limit = 12, now = new Date()) {
    const take = Math.min(52, Math.max(1, Math.floor(Number(limit)) || 12));
    const [services, activeMembers] = await Promise.all([
      this.prisma.service.findMany({
        where: {
          tenantId: this.tenantId,
          cancelledAt: null,
          scheduledAt: { lte: now },
          // A SPECIAL row is usually a placeholder for a day nobody gathered;
          // it only counts once ushers have recorded people in it.
          OR: [{ serviceType: { not: ServiceType.SPECIAL } }, { ServiceHeadcount: { isNot: null } }],
        },
        orderBy: { scheduledAt: 'desc' },
        take,
        select: {
          id: true,
          name: true,
          serviceType: true,
          scheduledAt: true,
          ServiceHeadcount: {
            select: { men: true, women: true, boys: true, girls: true, firstTimers: true, total: true, status: true },
          },
        },
      }),
      this.prisma.member.count({ where: activeMembersOf(this.tenantId) }),
    ]);

    const ids = services.map((s) => s.id);
    const [groups, present] = ids.length
      ? await Promise.all([
          this.prisma.attendanceRecord.groupBy({
            by: ['serviceId', 'present'],
            where: { tenantId: this.tenantId, serviceId: { in: ids }, Member: ACTIVE_MEMBER },
            _count: { _all: true },
          }),
          // Who checked in, to split them into men and women. Gender is stored
          // in mixed case ("Male", "MALE"), so it is read per row, not grouped.
          this.prisma.attendanceRecord.findMany({
            where: { tenantId: this.tenantId, serviceId: { in: ids }, present: true, Member: ACTIVE_MEMBER },
            select: { serviceId: true, Member: { select: { gender: true } } },
          }),
        ])
      : [[], []];
    const countOf = (serviceId: string, isPresent: boolean) =>
      groups.find((g) => g.serviceId === serviceId && g.present === isPresent)?._count._all ?? 0;
    const byGender = new Map<string, { men: number; women: number; unknown: number }>();
    for (const r of present) {
      const split = byGender.get(r.serviceId) ?? { men: 0, women: 0, unknown: 0 };
      const g = r.Member.gender?.toUpperCase();
      if (g === 'MALE') split.men += 1;
      else if (g === 'FEMALE') split.women += 1;
      else split.unknown += 1;
      byGender.set(r.serviceId, split);
    }

    return {
      activeMembers,
      services: services.map((s) => {
        const hc = s.ServiceHeadcount;
        return {
          id: s.id,
          name: s.name,
          serviceType: s.serviceType,
          date: watDateStr(s.scheduledAt),
          headcount: hc ? { ...hc, children: hc.boys + hc.girls } : null,
          checkedIn: countOf(s.id, true),
          checkedInByGender: byGender.get(s.id) ?? { men: 0, women: 0, unknown: 0 },
          absent: countOf(s.id, false),
        };
      }),
    };
  }
}
