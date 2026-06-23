import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { QueryFilter, resolveRange, watStr, svcKey, svcTypeWhere } from './attendance-analytics.utils';

@Injectable()
export class AttendanceAnalyticsService {
  private readonly tid: string;
  constructor(private readonly prisma: PrismaService, cfg: ConfigService<Env, true>) {
    this.tid = cfg.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getOverview(filter: QueryFilter) {
    const { start, end, prevStart, prevEnd } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const arWhere = (s: Date, e: Date) => ({ tenantId: this.tid, Service: { scheduledAt: { gte: s, lt: e }, ...svcWhere } });

    const [curr, prev, currPresent, prevPresent, currSvcs, prevSvcs, totalMembers] = await Promise.all([
      this.prisma.attendanceRecord.count({ where: arWhere(start, end) }),
      this.prisma.attendanceRecord.count({ where: arWhere(prevStart, prevEnd) }),
      this.prisma.attendanceRecord.count({ where: { ...arWhere(start, end), present: true } }),
      this.prisma.attendanceRecord.count({ where: { ...arWhere(prevStart, prevEnd), present: true } }),
      this.prisma.service.count({ where: { tenantId: this.tid, scheduledAt: { gte: start, lt: end }, ...svcWhere } }),
      this.prisma.service.count({ where: { tenantId: this.tid, scheduledAt: { gte: prevStart, lt: prevEnd }, ...svcWhere } }),
      this.prisma.member.count({ where: { tenantId: this.tid } }),
    ]);

    const rate = curr > 0 ? currPresent / curr : 0;
    const prevRate = prev > 0 ? prevPresent / prev : 0;
    return {
      attendanceRate: Math.round(rate * 1000) / 10,
      attendanceRateChange: Math.round((rate - prevRate) * 1000) / 10,
      totalPresent: currPresent, totalPresentChange: currPresent - prevPresent,
      totalAbsent: curr - currPresent, totalAbsentChange: (curr - currPresent) - (prev - prevPresent),
      avgPerService: currSvcs > 0 ? Math.round((currPresent / currSvcs) * 10) / 10 : 0,
      totalServicesHeld: currSvcs, totalServicesHeldChange: currSvcs - prevSvcs, totalMembers,
      dateRange: { from: watStr(start), to: watStr(new Date(end.getTime() - 1)) },
    };
  }

  async getTrend(filter: QueryFilter) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tid, scheduledAt: { gte: start, lt: end }, ...svcWhere },
      orderBy: { scheduledAt: 'asc' },
      include: { AttendanceRecord: { select: { present: true } } },
    });
    return services.map((s: any) => {
      const present = s.AttendanceRecord.filter((r: any) => r.present).length;
      const total = s.AttendanceRecord.length;
      return { date: watStr(s.scheduledAt), serviceKey: svcKey(s.serviceType), present, absent: total - present, total, rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 };
    });
  }

  async getSplit(filter: QueryFilter) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const where = { tenantId: this.tid, Service: { scheduledAt: { gte: start, lt: end }, ...svcWhere } };
    const [total, present] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.count({ where: { ...where, present: true } }),
    ]);
    return { present, absent: total - present, total, rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 };
  }

  async getRateTrend(filter: QueryFilter) {
    const services = await this.getTrend(filter);
    const { period } = filter;
    if (period === 'year' || !filter.dateFrom) {
      const monthly: Record<string, { total: number; present: number }> = {};
      services.forEach((s) => {
        const key = s.date.slice(0, 7);
        if (!monthly[key]) monthly[key] = { total: 0, present: 0 };
        monthly[key].total += s.total; monthly[key].present += s.present;
      });
      if (Object.keys(monthly).length > 4) {
        return Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([label, v]) => ({ label, rate: v.total > 0 ? Math.round((v.present / v.total) * 1000) / 10 : 0 }));
      }
    }
    return services.map((s) => ({ label: s.date, rate: s.rate }));
  }

  async getAbsenteeTrend(filter: QueryFilter) {
    const services = await this.getTrend(filter);
    return services.map((s) => ({ label: s.date, absent: s.absent, total: s.total, rate: s.total > 0 ? Math.round((s.absent / s.total) * 1000) / 10 : 0 }));
  }
}
