import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { WAT_MS, QueryFilter, resolveRange, watStr, svcKey, svcTypeWhere } from './attendance-analytics.utils';

/** First-timers, retention, heatmap, peak-hours. */
@Injectable()
export class AttendanceInsightsService {
  private readonly tid: string;
  constructor(private readonly prisma: PrismaService, cfg: ConfigService<Env, true>) {
    this.tid = cfg.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getFirstTimers(filter: QueryFilter) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId: this.tid, present: true, Service: { scheduledAt: { gte: start, lt: end }, ...svcWhere } },
      distinct: ['memberId'],
      select: { memberId: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } }, Service: { select: { scheduledAt: true, serviceType: true } } },
    });
    const ids = records.map((r: any) => r.memberId);
    if (ids.length === 0) return [];
    const returning = await this.prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: { tenantId: this.tid, memberId: { in: ids }, present: true, Service: { scheduledAt: { lt: start } } },
    });
    const returningIds = new Set(returning.map((r: any) => r.memberId));
    return records
      .filter((r: any) => !returningIds.has(r.memberId))
      .map((r: any) => ({ userId: r.memberId, name: `${r.Member.firstName} ${r.Member.lastName}`, photoUrl: r.Member.photoUrl, firstAttendedAt: watStr(r.Service.scheduledAt), serviceKey: svcKey(r.Service.serviceType) }));
  }

  async getRetention(filter: QueryFilter) {
    const { start, end, prevStart, prevEnd } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const [prevRaw, currRaw] = await Promise.all([
      this.prisma.attendanceRecord.findMany({ where: { tenantId: this.tid, present: true, Service: { scheduledAt: { gte: prevStart, lt: prevEnd }, ...svcWhere } }, distinct: ['memberId'], select: { memberId: true } }),
      this.prisma.attendanceRecord.findMany({ where: { tenantId: this.tid, present: true, Service: { scheduledAt: { gte: start, lt: end }, ...svcWhere } }, distinct: ['memberId'], select: { memberId: true } }),
    ]);
    const prevIds = new Set(prevRaw.map((r: any) => r.memberId));
    const currIds = new Set(currRaw.map((r: any) => r.memberId));
    const retained = [...prevIds].filter((id) => currIds.has(id)).length;
    const rate = prevIds.size > 0 ? Math.round((retained / prevIds.size) * 1000) / 10 : 0;
    return { rate, retained, lost: prevIds.size - retained, newAttendees: [...currIds].filter((id) => !prevIds.has(id)).length, prevPeriodCount: prevIds.size, currPeriodCount: currIds.size };
  }

  async getHeatmap(year: number, serviceType?: string) {
    const start = new Date(Date.UTC(year, 0, 1) - WAT_MS);
    const end   = new Date(Date.UTC(year + 1, 0, 1) - WAT_MS);
    const svcWhere = svcTypeWhere(serviceType);
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tid, scheduledAt: { gte: start, lt: end }, ...svcWhere },
      select: { scheduledAt: true, serviceType: true, AttendanceRecord: { select: { present: true } } },
    });
    return services.map((s: any) => {
      const total = s.AttendanceRecord.length;
      const present = s.AttendanceRecord.filter((r: any) => r.present).length;
      return { date: watStr(s.scheduledAt), serviceKey: svcKey(s.serviceType), present, total, rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 };
    });
  }

  async getPeakHours(filter: QueryFilter) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId: this.tid, present: true, Service: { scheduledAt: { gte: start, lt: end }, ...svcWhere } },
      select: { checkedInAt: true },
    });
    const buckets: Record<string, number> = {};
    records.forEach((r: any) => {
      const wat = new Date(r.checkedInAt.getTime() + WAT_MS);
      const hh = wat.getUTCHours().toString().padStart(2, '0');
      const mm = wat.getUTCMinutes() < 30 ? '00' : '30';
      buckets[`${hh}:${mm}`] = (buckets[`${hh}:${mm}`] ?? 0) + 1;
    });
    return Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([time, count]) => ({ time, count }));
  }
}
