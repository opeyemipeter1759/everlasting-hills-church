import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

const WAT_OFFSET_MS = 60 * 60 * 1000;

function getWatMonthBounds(year: number, month: number) {
  const startUtc = new Date(Date.UTC(year, month, 1) - WAT_OFFSET_MS);
  const endUtc = new Date(Date.UTC(year, month + 1, 1) - WAT_OFFSET_MS);
  return { startUtc, endUtc };
}

function countServiceDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 3) count++;
  }
  return count;
}

@Injectable()
export class OverviewService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async getMemberByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return null;

    return this.prisma.member.findUnique({
      where: { profileId: profile.id },
    });
  }

  async getMemberOverview(userId: string) {
    const member = await this.getMemberByUserId(userId);

    const now = new Date();
    const watNow = new Date(now.getTime() + WAT_OFFSET_MS);
    const year = watNow.getUTCFullYear();
    const month = watNow.getUTCMonth();
    const { startUtc, endUtc } = getWatMonthBounds(year, month);
    const total = countServiceDaysInMonth(year, month);

    if (!member) {
      return {
        attendance: { marked: 0, total, percentage: 0, lastMarkedAt: null },
        streakWeeks: 0,
        coursesCompleted: 0,
      };
    }

    const [records, streakWeeks, coursesCompleted] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: {
          memberId: member.id,
          tenantId: this.tenantId,
          present: true,
          Service: { scheduledAt: { gte: startUtc, lt: endUtc } },
        },
        include: { Service: { select: { scheduledAt: true } } },
        orderBy: { Service: { scheduledAt: 'desc' } },
      }),
      this.computeStreakWeeks(member.id),
      this.prisma.courseEnrollment.count({
        where: { tenantId: this.tenantId, memberId: member.id, completed: true },
      }),
    ]);

    const marked = records.length;
    const percentage = total > 0 ? Math.round((marked / total) * 100) : 0;
    const lastMarkedAt = records[0]?.Service?.scheduledAt ?? null;

    return {
      attendance: { marked, total, percentage, lastMarkedAt },
      streakWeeks,
      coursesCompleted,
    };
  }

  /** Consecutive WAT-calendar weeks (counting back from the most recent past
   * service) in which the member attended at least one service. Stops at the
   * first week that had a scheduled service but no attendance — a relatable
   * "how many weeks in a row have I shown up" number, not tied to any one
   * service type. */
  private async computeStreakWeeks(memberId: string): Promise<number> {
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId, scheduledAt: { lte: new Date() } },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true, scheduledAt: true },
    });
    if (services.length === 0) return 0;

    const attended = await this.prisma.attendanceRecord.findMany({
      where: { tenantId: this.tenantId, memberId, present: true, serviceId: { in: services.map((s) => s.id) } },
      select: { serviceId: true },
    });
    const attendedIds = new Set(attended.map((a) => a.serviceId));

    const weekKey = (d: Date): string => {
      const wat = new Date(d.getTime() + WAT_OFFSET_MS);
      const dayMs = 24 * 60 * 60 * 1000;
      const startOfYear = Date.UTC(wat.getUTCFullYear(), 0, 1);
      const daysSinceYearStart = Math.floor(
        (Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate()) - startOfYear) / dayMs,
      );
      const week = Math.floor((daysSinceYearStart + new Date(startOfYear).getUTCDay()) / 7);
      return `${wat.getUTCFullYear()}-${week}`;
    };

    // Most-recent-first map of weekKey -> "attended at least one service that week".
    const weeks = new Map<string, boolean>();
    for (const s of services) {
      const key = weekKey(s.scheduledAt);
      weeks.set(key, (weeks.get(key) ?? false) || attendedIds.has(s.id));
    }

    let streak = 0;
    for (const attendedThatWeek of weeks.values()) {
      if (!attendedThatWeek) break;
      streak++;
    }
    return streak;
  }
}
