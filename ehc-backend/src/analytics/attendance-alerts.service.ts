import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { QueryFilter, resolveRange, watStr, svcKey, svcTypeWhere } from './attendance-analytics.utils';

/** Member consistency scores/streaks, per-service-type health scores, at-risk/milestone alerts. */
@Injectable()
export class AttendanceAlertsService {
  private readonly tid: string;
  constructor(private readonly prisma: PrismaService, cfg: ConfigService<Env, true>) {
    this.tid = cfg.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getConsistency(filter: QueryFilter, limit = 10) {
    const { start, end } = resolveRange(filter);
    const svcWhere = svcTypeWhere(filter.serviceType);
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tid, scheduledAt: { gte: start, lt: end }, ...svcWhere },
      orderBy: { scheduledAt: 'asc' }, select: { id: true },
    });
    if (services.length === 0) return [];
    const svcIds = services.map((s: any) => s.id);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId: this.tid, serviceId: { in: svcIds } },
      select: { memberId: true, serviceId: true, present: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } },
    });
    const m = new Map<string, { name: string; photoUrl: string | null; presence: boolean[] }>();
    records.forEach((r: any) => {
      if (!m.has(r.memberId)) m.set(r.memberId, { name: `${r.Member.firstName} ${r.Member.lastName}`, photoUrl: r.Member.photoUrl ?? null, presence: Array(svcIds.length).fill(false) });
      const idx = svcIds.indexOf(r.serviceId);
      if (r.present && idx >= 0) m.get(r.memberId)!.presence[idx] = true;
    });
    return Array.from(m.entries()).map(([userId, { name, photoUrl, presence }]) => {
      const attended = presence.filter(Boolean).length;
      const rate = services.length > 0 ? Math.round((attended / services.length) * 100) : 0;
      let cur = 0, max = 0, tmp = 0, mis = 0, inCur = true;
      for (let i = presence.length - 1; i >= 0; i--) {
        if (presence[i]) { if (inCur) cur++; tmp++; max = Math.max(max, tmp); if (cur > 0) mis = 0; }
        else { inCur = false; tmp = 0; if (cur === 0) mis++; }
      }
      return { userId, name, photoUrl, rate, attended, total: services.length, currentStreak: cur, longestStreak: max, missedStreak: mis, consistencyScore: Math.min(Math.round(rate * 0.6 + Math.min(cur * 5, 40)), 100) };
    }).sort((a, b) => b.consistencyScore - a.consistencyScore).slice(0, limit);
  }

  async getServiceHealth() {
    const eightSvcsAgo = new Date(Date.now() - 90 * 86_400_000);
    return Promise.all(['SUNDAY', 'WEDNESDAY', 'SPECIAL'].map(async (type) => {
      const svcs = await this.prisma.service.findMany({
        where: { tenantId: this.tid, serviceType: type as any, scheduledAt: { gte: eightSvcsAgo } },
        orderBy: { scheduledAt: 'desc' }, take: 8,
        select: { AttendanceRecord: { select: { present: true } } },
      });
      if (svcs.length === 0) return { serviceKey: svcKey(type), healthScore: 0, avgRate: 0, trend: 0, sessionsReviewed: 0 };
      const rates = svcs.map((s: any) => { const t = s.AttendanceRecord.length; const p = s.AttendanceRecord.filter((r: any) => r.present).length; return t > 0 ? p / t : 0; });
      const avgRate = Math.round((rates.reduce((a: number, b: number) => a + b, 0) / rates.length) * 100);
      const half = Math.ceil(rates.length / 2);
      const recent = rates.slice(0, half).reduce((a: number, b: number) => a + b, 0) / half;
      const older  = rates.slice(half).reduce((a: number, b: number) => a + b, 0) / (rates.length - half || 1);
      const trend  = Math.round((recent - older) * 100);
      return { serviceKey: svcKey(type), healthScore: Math.min(Math.round(avgRate * 0.7 + Math.min(Math.max(trend, 0) * 0.3, 30)), 100), avgRate, trend, sessionsReviewed: svcs.length };
    }));
  }

  async getAlerts() {
    const threeWeeksAgo = new Date(Date.now() - 21 * 86_400_000);
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tid, scheduledAt: { gte: threeWeeksAgo } },
      orderBy: { scheduledAt: 'asc' },
      select: { id: true, scheduledAt: true, AttendanceRecord: { select: { memberId: true, present: true } } },
    });
    const alerts: { id: string; type: string; severity: string; message: string; memberName?: string | null; memberPhotoUrl?: string | null; timestamp: string }[] = [];
    services.forEach((s: any) => {
      const total = s.AttendanceRecord.length, present = s.AttendanceRecord.filter((r: any) => r.present).length;
      const rate = total > 0 ? (present / total) * 100 : 0;
      if (rate < 60 && total > 5) alerts.push({ id: `lt-${s.id}`, type: 'LOW_TURNOUT', severity: 'warning', message: `Low attendance (${Math.round(rate)}%) on ${watStr(s.scheduledAt)}`, timestamp: s.scheduledAt.toISOString() });
      if (rate >= 90 && total > 5) alerts.push({ id: `ms-${s.id}`, type: 'MILESTONE', severity: 'info', message: `Great session! ${Math.round(rate)}% attendance on ${watStr(s.scheduledAt)}`, timestamp: s.scheduledAt.toISOString() });
    });
    const absentees = new Map<string, number>();
    services.forEach((s: any) => s.AttendanceRecord.forEach((r: any) => { if (!r.present) absentees.set(r.memberId, (absentees.get(r.memberId) ?? 0) + 1); }));
    const atRiskIds = Array.from(absentees.entries()).filter(([, c]) => c >= 3).map(([id]) => id);
    const atRiskMembers = atRiskIds.length > 0 ? await this.prisma.member.findMany({ where: { id: { in: atRiskIds } }, select: { id: true, firstName: true, lastName: true, photoUrl: true } }) : [];
    const memberInfoMap = new Map(atRiskMembers.map((m: any) => [m.id, { name: `${m.firstName} ${m.lastName}`, photoUrl: m.photoUrl ?? null }]));
    for (const [memberId, count] of absentees.entries()) {
      if (count >= 3) {
        const info = memberInfoMap.get(memberId);
        alerts.push({ id: `ar-${memberId}`, type: 'AT_RISK', severity: 'warning', message: `${info?.name ?? 'A member'} has been absent ${count} times in the last 3 weeks`, memberName: info?.name ?? null, memberPhotoUrl: info?.photoUrl ?? null, timestamp: new Date().toISOString() });
      }
    }
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);
  }
}
