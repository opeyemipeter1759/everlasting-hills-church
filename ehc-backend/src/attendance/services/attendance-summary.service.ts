import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class AttendanceSummaryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getAttendanceSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalServices, totalCheckins, thisMonthCheckins, lastMonthCheckins, totalMembers] = await Promise.all([
      this.prisma.service.count({ where: { tenantId: this.tenantId } }),
      this.prisma.attendanceRecord.count({
        where: { tenantId: this.tenantId, present: true },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          tenantId: this.tenantId,
          present: true,
          Service: { scheduledAt: { gte: monthStart } },
        },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          tenantId: this.tenantId,
          present: true,
          Service: { scheduledAt: { gte: lastMonthStart, lt: monthStart } },
        },
      }),
      this.prisma.member.count({
        where: { tenantId: this.tenantId, status: 'ACTIVE' },
      }),
    ]);

    const avgAttendance = totalServices > 0 ? Math.round(totalCheckins / totalServices) : 0;
    const momChange =
      lastMonthCheckins === 0
        ? 0
        : Math.round(((thisMonthCheckins - lastMonthCheckins) / lastMonthCheckins) * 100);

    return {
      totalServices,
      totalCheckins,
      thisMonthCheckins,
      lastMonthCheckins,
      avgAttendance,
      momChange,
      totalMembers,
      attendanceRate: totalMembers > 0 ? Math.round((avgAttendance / totalMembers) * 100) : 0,
    };
  }
}
