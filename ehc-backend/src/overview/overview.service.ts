import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { computeLevel } from './streak-ladder';

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
        streak: computeLevel({ attendance: 0, course: 0, sermon: 0 }),
        coursesCompleted: 0,
        sermonsCompleted: 0,
      };
    }

    const [records, lifetimeAttendance, coursesCompleted, sermonsCompleted] = await Promise.all([
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
      this.prisma.attendanceRecord.count({
        where: { tenantId: this.tenantId, memberId: member.id, present: true },
      }),
      this.prisma.courseEnrollment.count({
        where: { tenantId: this.tenantId, memberId: member.id, completed: true },
      }),
      this.prisma.listenProgress.count({
        where: { tenantId: this.tenantId, memberId: member.id, completed: true },
      }),
    ]);

    const marked = records.length;
    const percentage = total > 0 ? Math.round((marked / total) * 100) : 0;
    const lastMarkedAt = records[0]?.Service?.scheduledAt ?? null;

    // "Streak" is a 2go-style level ladder, not a raw count: the member's lifetime
    // {services attended, courses completed, sermons completed} are consumed
    // level-by-level against an endless, escalating task sequence (see streak-ladder.ts).
    const streak = computeLevel({ attendance: lifetimeAttendance, course: coursesCompleted, sermon: sermonsCompleted });

    return {
      attendance: { marked, total, percentage, lastMarkedAt },
      streak,
      coursesCompleted,
      sermonsCompleted,
    };
  }
}
