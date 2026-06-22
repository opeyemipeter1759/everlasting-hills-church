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
}
