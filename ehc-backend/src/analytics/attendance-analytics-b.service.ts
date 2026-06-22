import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { WAT_MS, QueryFilter, resolveRange, watStr, svcKey, svcTypeWhere, monthBounds } from './attendance-analytics.utils';

@Injectable()
export class AttendanceAnalyticsBService {
  private readonly tid: string;
  constructor(private readonly prisma: PrismaService, cfg: ConfigService<Env, true>) {
    this.tid = cfg.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getServiceComparison(filter: QueryFilter) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tid, scheduledAt: { gte: start, lt: end }, ...svcWhere },
      orderBy: { scheduledAt: 'asc' },
      select: { scheduledAt: true, serviceType: true, AttendanceRecord: { select: { present: true } } },
    });
    const byType: Record<string, { present: number; total: number }> = {};
    services.forEach((s: any) => {
      const key = svcKey(s.serviceType);
      if (!byType[key]) byType[key] = { present: 0, total: 0 };
      byType[key].total += s.AttendanceRecord.length;
      byType[key].present += s.AttendanceRecord.filter((r: any) => r.present).length;
    });
    return Object.entries(byType).map(([serviceKey, v]) => ({
      serviceKey, present: v.present, absent: v.total - v.present, total: v.total,
      rate: v.total > 0 ? Math.round((v.present / v.total) * 1000) / 10 : 0,
    }));
  }

  async getMemberGrowth(filter: QueryFilter) {
    const { start, end } = resolveRange(filter);
    const members = await this.prisma.member.findMany({
      where: { tenantId: this.tid, joinedAt: { gte: start, lt: end } },
      select: { joinedAt: true }, orderBy: { joinedAt: 'asc' },
    });
    const allBefore = await this.prisma.member.count({ where: { tenantId: this.tid, joinedAt: { lt: start } } });
    const spanDays = (end.getTime() - start.getTime()) / 86_400_000;

    const buckets: Record<string, number> = {};
    members.forEach((m: any) => {
      const key = spanDays > 60
        ? new Date(m.joinedAt.getTime() + WAT_MS).toISOString().slice(0, 7)
        : watStr(m.joinedAt);
      buckets[key] = (buckets[key] ?? 0) + 1;
    });
    let running = allBefore;
    return Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([label, newCount]) => {
      running += newCount;
      return { label, newMembers: newCount, totalMembers: running };
    });
  }

  async getLeaderboard(filter: QueryFilter, limit = 10) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tid, scheduledAt: { gte: start, lt: end }, ...svcWhere },
      orderBy: { scheduledAt: 'asc' }, select: { id: true },
    });
    if (services.length === 0) return [];
    const serviceIds = services.map((s: any) => s.id);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId: this.tid, serviceId: { in: serviceIds } },
      select: { memberId: true, present: true, serviceId: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } },
    });
    const memberMap = new Map<string, { name: string; photoUrl: string | null; attended: number; presentByIdx: boolean[] }>();
    records.forEach((r: any) => {
      if (!memberMap.has(r.memberId)) memberMap.set(r.memberId, { name: `${r.Member.firstName} ${r.Member.lastName}`, photoUrl: r.Member.photoUrl, attended: 0, presentByIdx: Array(services.length).fill(false) });
      const entry = memberMap.get(r.memberId)!;
      const svcIdx = serviceIds.indexOf(r.serviceId);
      if (r.present) { entry.attended++; if (svcIdx >= 0) entry.presentByIdx[svcIdx] = true; }
    });
    return Array.from(memberMap.entries()).map(([userId, d]) => {
      const rate = services.length > 0 ? Math.round((d.attended / services.length) * 100) : 0;
      let streak = 0;
      for (let i = d.presentByIdx.length - 1; i >= 0; i--) { if (d.presentByIdx[i]) streak++; else break; }
      return { userId, name: d.name, photoUrl: d.photoUrl, attended: d.attended, total: services.length, rate, currentStreak: streak };
    }).sort((a, b) => b.attended - a.attended || b.rate - a.rate).slice(0, limit);
  }

  async getComparePeriods(
    a: { period?: string; dateFrom?: string; dateTo?: string },
    b: { period?: string; dateFrom?: string; dateTo?: string },
  ) {
    const summarize = async (q: typeof a) => {
      const range = resolveRange(q as QueryFilter);
      const [total, present, svcs] = await Promise.all([
        this.prisma.attendanceRecord.count({ where: { tenantId: this.tid, Service: { scheduledAt: { gte: range.start, lt: range.end } } } }),
        this.prisma.attendanceRecord.count({ where: { tenantId: this.tid, present: true, Service: { scheduledAt: { gte: range.start, lt: range.end } } } }),
        this.prisma.service.count({ where: { tenantId: this.tid, scheduledAt: { gte: range.start, lt: range.end } } }),
      ]);
      return { total, present, absent: total - present, servicesHeld: svcs, rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0, avgPerService: svcs > 0 ? Math.round((present / svcs) * 10) / 10 : 0, dateRange: { from: watStr(range.start), to: watStr(new Date(range.end.getTime() - 1)) } };
    };
    const [aStats, bStats] = await Promise.all([summarize(a), summarize(b)]);
    return { periodA: { label: a.period ?? `${a.dateFrom} – ${a.dateTo}`, ...aStats }, periodB: { label: b.period ?? `${b.dateFrom} – ${b.dateTo}`, ...bStats } };
  }
}
