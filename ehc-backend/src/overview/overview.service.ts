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
      };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        memberId: member.id,
        tenantId: this.tenantId,
        present: true,
        Service: { scheduledAt: { gte: startUtc, lt: endUtc } },
      },
      include: { Service: { select: { scheduledAt: true } } },
      orderBy: { Service: { scheduledAt: 'desc' } },
    });

    const marked = records.length;
    const percentage = total > 0 ? Math.round((marked / total) * 100) : 0;
    const lastMarkedAt = records[0]?.Service?.scheduledAt ?? null;

    return {
      attendance: { marked, total, percentage, lastMarkedAt },
    };
  }
}
