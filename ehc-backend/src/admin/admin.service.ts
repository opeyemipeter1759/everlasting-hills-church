import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
      activeMembers,
      totalVisitors, vThis, vLast,
      totalEvents, eThis, eLast,
      totalSermons, sThis, sLast,
      volunteerRows, volThis, volLast,
      recentServices,
    ] = await Promise.all([
      this.prisma.member.count({ where: { tenantId: t } }),
      this.prisma.member.count({ where: { tenantId: t, joinedAt: thisM } }),
      this.prisma.member.count({ where: { tenantId: t, joinedAt: lastM } }),
      this.prisma.member.count({ where: { tenantId: t, status: 'ACTIVE' } }),
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
      // Last several services with their type + present count. We pick the most
      // recent service for the card value and compare to the previous service of
      // the SAME type (Sunday→Sunday, Wednesday→Wednesday) so the trend isn't
      // distorted by Sunday/Wednesday size differences.
      this.prisma.service.findMany({
        where: { tenantId: t },
        orderBy: { scheduledAt: 'desc' },
        take: 12,
        select: {
          serviceType: true,
          _count: { select: { AttendanceRecord: { where: { present: true } } } },
        },
      }),
    ]);

    const volunteers = volunteerRows.length;

    // Attendance = most recent service's check-ins, vs the previous service of the
    // same type, plus a rate against active members (who are all expected to attend).
    const last = recentServices[0];
    const lastAttendance = last?._count.AttendanceRecord ?? 0;
    const prevSameType = recentServices
      .slice(1)
      .find((s) => s.serviceType === last?.serviceType);
    const prevAttendance = prevSameType?._count.AttendanceRecord ?? 0;
    const rate = activeMembers > 0 ? Math.round((lastAttendance / activeMembers) * 100) : 0;
    const attendanceNote = last
      ? `${lastAttendance}/${activeMembers} active · ${rate}%`
      : 'No services yet';

    return {
      stats: [
        { key: 'members', label: 'Members', value: totalMembers, trend: this.trend(mThis, mLast) },
        {
          key: 'attendance',
          label: 'Last Service',
          value: lastAttendance,
          trend: this.trend(lastAttendance, prevAttendance),
          note: attendanceNote,
        },
        { key: 'visitors', label: 'Visitors', value: totalVisitors, trend: this.trend(vThis, vLast) },
        { key: 'volunteers', label: 'Volunteers', value: volunteers, trend: this.trend(volThis, volLast) },
        { key: 'events', label: 'Events', value: totalEvents, trend: this.trend(eThis, eLast) },
        { key: 'sermons', label: 'Sermons', value: totalSermons, trend: this.trend(sThis, sLast) },
      ],
    };
  }
}
