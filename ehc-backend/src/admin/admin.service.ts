import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HeadcountService } from '../headcount/headcount.service';
import type { Env } from '../config/env.validation';

const WAT = 60 * 60 * 1000;

function todayBounds() {
  const wat = new Date(Date.now() + WAT);
  const startUtc = new Date(
    Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate()) - WAT,
  );
  return { startUtc, endUtc: new Date(startUtc.getTime() + 86_400_000) };
}

@Injectable()
export class AdminService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly headcount: HeadcountService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getStatsOverview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const { startUtc, endUtc } = todayBounds();

    const [totalMembers, todayPresent, activeThisMonthRows] = await Promise.all([
      this.prisma.member.count({ where: { tenantId: this.tenantId } }),
      this.prisma.attendanceRecord.count({
        where: {
          tenantId: this.tenantId,
          present: true,
          Service: { scheduledAt: { gte: startUtc, lt: endUtc } },
        },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['memberId'],
        where: {
          tenantId: this.tenantId,
          present: true,
          Service: { scheduledAt: { gte: monthStart, lt: monthEnd } },
        },
      }),
    ]);

    const activeThisMonth = activeThisMonthRows.length;
    const inactiveThisMonth = Math.max(0, totalMembers - activeThisMonth);

    return { totalMembers, activeThisMonth, inactiveThisMonth, todayPresent };
  }

  /** Month-over-month percentage change as a {value, direction} trend. */
  private trend(curr: number, prev: number): { value: number; direction: 'up' | 'down' } {
    if (prev <= 0) {
      return { value: curr > 0 ? 100 : 0, direction: 'up' };
    }
    const change = ((curr - prev) / prev) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      direction: change >= 0 ? 'up' : 'down',
    };
  }

  /**
   * Real data for the admin dashboard stat cards. Each card's value is a live
   * count; each trend is month-over-month (attendance compares the last two
   * services). Shape matches the frontend SummaryStat[].
   */
  async getDashboardSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const t = this.tenantId;
    const thisM = { gte: monthStart };
    const lastM = { gte: lastMonthStart, lt: monthStart };

    const [
      totalMembers, mThis, mLast,
      totalVisitors, vThis, vLast,
      totalEvents, eThis, eLast,
      totalSermons, sThis, sLast,
      volunteerRows, volThis, volLast,
      recentHeadcounts,
    ] = await Promise.all([
      this.prisma.member.count({ where: { tenantId: t } }),
      this.prisma.member.count({ where: { tenantId: t, joinedAt: thisM } }),
      this.prisma.member.count({ where: { tenantId: t, joinedAt: lastM } }),
      this.prisma.visitor.count({ where: { tenantId: t } }),
      this.prisma.visitor.count({ where: { tenantId: t, submittedAt: thisM } }),
      this.prisma.visitor.count({ where: { tenantId: t, submittedAt: lastM } }),
      this.prisma.event.count({ where: { tenantId: t } }),
      this.prisma.event.count({ where: { tenantId: t, createdAt: thisM } }),
      this.prisma.event.count({ where: { tenantId: t, createdAt: lastM } }),
      this.prisma.sermon.count({ where: { tenantId: t } }),
      this.prisma.sermon.count({ where: { tenantId: t, createdAt: thisM } }),
      this.prisma.sermon.count({ where: { tenantId: t, createdAt: lastM } }),
      this.prisma.unitMember.groupBy({ by: ['memberId'], where: { tenantId: t } }),
      this.prisma.unitMember.count({ where: { tenantId: t, joinedAt: thisM } }),
      this.prisma.unitMember.count({ where: { tenantId: t, joinedAt: lastM } }),
      // Congregation size is now sourced from the authoritative usher headcount,
      // NOT individual check-ins. Most recent CONFIRMED headcounts; we compare the
      // latest to the previous of the SAME service type so Sunday/Wednesday size
      // differences don't distort the trend.
      this.prisma.serviceHeadcount.findMany({
        where: { tenantId: t, status: 'CONFIRMED' },
        orderBy: { Service: { scheduledAt: 'desc' } },
        take: 12,
        include: { Service: { select: { name: true, scheduledAt: true, serviceType: true } } },
      }),
    ]);

    const volunteers = volunteerRows.length;

    // Attendance card = the latest confirmed congregation headcount (bodies in the
    // room), vs the previous headcount of the SAME service type. Named after the
    // service, with its date + first-timers on the sub-line. This is congregation-
    // level truth; per-member attendance % lives on the member-facing metrics.
    const lastHc = recentHeadcounts[0];
    const lastAttendance = lastHc?.total ?? 0;
    const prevSameType = recentHeadcounts
      .slice(1)
      .find((h) => h.Service.serviceType === lastHc?.Service.serviceType);
    const prevAttendance = prevSameType?.total ?? 0;
    const attendanceLabel = lastHc?.Service.name ?? 'Congregation';
    const svcDate = lastHc
      ? new Date(lastHc.Service.scheduledAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'Africa/Lagos',
        })
      : '';
    const attendanceNote = lastHc
      ? `${svcDate} · ${lastHc.firstTimers} first-timer${lastHc.firstTimers === 1 ? '' : 's'}`
      : 'No headcount recorded yet';

    return {
      stats: [
        { key: 'members', label: 'Members', value: totalMembers, trend: this.trend(mThis, mLast) },
        {
          key: 'attendance',
          label: attendanceLabel,
          value: lastAttendance,
          trend: this.trend(lastAttendance, prevAttendance),
          note: attendanceNote,
        },
        { key: 'visitors', label: 'Visitors', value: totalVisitors, trend: this.trend(vThis, vLast) },
        { key: 'volunteers', label: 'Service Team', value: volunteers, trend: this.trend(volThis, volLast) },
        { key: 'events', label: 'Events', value: totalEvents, trend: this.trend(eThis, eLast) },
        { key: 'sermons', label: 'Sermons', value: totalSermons, trend: this.trend(sThis, sLast) },
      ],
    };
  }

  /**
   * Attendance trend for the dashboard growth chart. Now sourced from the
   * authoritative usher headcount (total bodies per service), NOT individual
   * check-ins. Each point is chronological, tagged by service type (so the UI can
   * compare like service to like service), and carries the category breakdown
   * (men / women / children / first-timers) for the growth surface.
   */
  async getAttendanceTrend(limit = 24) {
    const points = await this.headcount.getTrend({ limit });
    return { points };
  }
}
