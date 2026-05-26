import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { fetchAdminAnalytics, AdminAnalyticsData } from './admin-analytics';

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAnalytics(): Promise<AdminAnalyticsData> {
    return fetchAdminAnalytics();
  }

  async getDepartmentStats(unitId?: string) {
    const units = await this.prisma.unit.findMany({
      where: unitId ? { id: unitId, tenantId: TENANT_ID } : { tenantId: TENANT_ID },
      include: {
        UnitMember: {
          include: { Member: { select: { id: true, firstName: true, lastName: true, status: true } } },
        },
        _count: { select: { UnitMember: true } },
      },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    return Promise.all(
      units.map(async (unit) => {
        const memberIds = unit.UnitMember.map((um: any) => um.memberId);
        const activeCount = unit.UnitMember.filter((um: any) => um.Member.status === 'ACTIVE').length;

        const recentAttendees = await this.prisma.attendanceRecord.findMany({
          where: {
            tenantId: TENANT_ID,
            memberId: { in: memberIds },
            present: true,
            Service: { scheduledAt: { gte: thirtyDaysAgo } },
          },
          select: { memberId: true },
          distinct: ['memberId'],
        });

        const attendanceRate = activeCount > 0 ? Math.round((recentAttendees.length / activeCount) * 100) : 0;

        const lead = unit.UnitMember.find((um: any) => um.isLead);

        return {
          id: unit.id,
          name: unit.name,
          totalMembers: unit._count.UnitMember,
          activeMembers: activeCount,
          recentAttendees: recentAttendees.length,
          attendanceRate,
          leadName: lead ? `${lead.Member.firstName} ${lead.Member.lastName}` : null,
        };
      }),
    );
  }

  async getUnitMemberAttendance(unitId: string, months = 3) {
    const windowStart = new Date(Date.now() - months * 30 * 86400000);

    const [unitMembers, totalServices] = await Promise.all([
      this.prisma.unitMember.findMany({
        where: { tenantId: TENANT_ID, unitId },
        include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, status: true } } },
      }),
      this.prisma.service.count({ where: { tenantId: TENANT_ID, scheduledAt: { gte: windowStart } } }),
    ]);

    const result = await Promise.all(
      unitMembers.map(async (um: any) => {
        const attended = await this.prisma.attendanceRecord.count({
          where: {
            tenantId: TENANT_ID,
            memberId: um.memberId,
            present: true,
            Service: { scheduledAt: { gte: windowStart } },
          },
        });
        return {
          memberId: um.memberId,
          name: `${um.member.firstName} ${um.member.lastName}`,
          photoUrl: um.member.photoUrl,
          isLead: um.isLead,
          status: um.member.status,
          attended,
          total: totalServices,
          rate: totalServices > 0 ? Math.round((attended / totalServices) * 100) : 0,
        };
      }),
    );

    return result.sort((a, b) => b.rate - a.rate);
  }

  async getFirstTimerPipeline() {
    const [
      total,
      interestedCount,
      convertedEmails,
      notInterestedCount,
      onlineCount,
      inPersonCount,
    ] = await Promise.all([
      this.prisma.visitor.count({ where: { tenantId: TENANT_ID } }),
      this.prisma.visitor.count({ where: { tenantId: TENANT_ID, membershipInterest: 'Yes' } }),
      this.prisma.visitor.findMany({ where: { tenantId: TENANT_ID, membershipInterest: 'Yes', email: { not: null } }, select: { email: true } }),
      this.prisma.visitor.count({ where: { tenantId: TENANT_ID, membershipInterest: 'No' } }),
      this.prisma.visitor.count({ where: { tenantId: TENANT_ID, attendanceType: { contains: 'online', mode: 'insensitive' } } }),
      this.prisma.visitor.count({ where: { tenantId: TENANT_ID, attendanceType: { contains: 'person', mode: 'insensitive' } } }),
    ]);

    const interestedEmails = convertedEmails.map((v: any) => v.email).filter(Boolean) as string[];

    let convertedCount = 0;
    if (interestedEmails.length > 0) {
      convertedCount = await this.prisma.member.count({ where: { tenantId: TENANT_ID, email: { in: interestedEmails } } });
    }

    const conversionRate = interestedCount > 0 ? Math.round((convertedCount / interestedCount) * 100) : 0;
    const interestRate = total > 0 ? Math.round((interestedCount / total) * 100) : 0;

    return {
      total,
      interestedCount,
      convertedCount,
      notInterestedCount,
      undecidedCount: total - interestedCount - notInterestedCount,
      onlineCount,
      inPersonCount,
      conversionRate,
      interestRate,
    };
  }

  async getFirstTimerSources() {
    const visitors = await this.prisma.visitor.findMany({ where: { tenantId: TENANT_ID }, select: { howDidYouLearn: true } });
    const sourceMap: Record<string, number> = {};
    visitors.forEach((v: any) => {
      const key = v.howDidYouLearn?.trim() || 'Not specified';
      sourceMap[key] = (sourceMap[key] ?? 0) + 1;
    });
    return Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }

  async getFirstTimersByMonth(months = 6) {
    const now = new Date();
    const result: { label: string; count: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await this.prisma.visitor.count({ where: { tenantId: TENANT_ID, submittedAt: { gte: start, lt: end } } });
      result.push({ label: start.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), count });
    }
    return result;
  }

  async getGivingTrend(months = 6) {
    const now = new Date();
    const result: { label: string; amountNaira: number; count: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg = await this.prisma.givingRecord.aggregate({
        where: { tenantId: TENANT_ID, paystackStatus: 'success', createdAt: { gte: start, lt: end } },
        _sum: { amount: true },
        _count: { _all: true },
      });
      result.push({
        label: start.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        amountNaira: Math.round((agg._sum.amount ?? 0) / 100),
        count: agg._count._all,
      });
    }
    return result;
  }

  async getGivingByCategory() {
    const records = await this.prisma.givingRecord.groupBy({
      by: ['category'],
      where: { tenantId: TENANT_ID, paystackStatus: 'success' },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
    });
    return records.map((r: any) => ({
      category: r.category || 'General',
      amountNaira: Math.round((r._sum.amount ?? 0) / 100),
      count: r._count._all,
    }));
  }

  async getGivingSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [totalAll, thisMonth, lastMonth, thisYear, uniqueEmails, anonymous] = await Promise.all([
      this.prisma.givingRecord.aggregate({ where: { tenantId: TENANT_ID, paystackStatus: 'success' }, _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.givingRecord.aggregate({ where: { tenantId: TENANT_ID, paystackStatus: 'success', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      this.prisma.givingRecord.aggregate({ where: { tenantId: TENANT_ID, paystackStatus: 'success', createdAt: { gte: lastMonthStart, lt: monthStart } }, _sum: { amount: true } }),
      this.prisma.givingRecord.aggregate({ where: { tenantId: TENANT_ID, paystackStatus: 'success', createdAt: { gte: yearStart } }, _sum: { amount: true } }),
      this.prisma.givingRecord.findMany({ where: { tenantId: TENANT_ID, paystackStatus: 'success', donorEmail: { not: null } }, select: { donorEmail: true }, distinct: ['donorEmail'] }),
      this.prisma.givingRecord.count({ where: { tenantId: TENANT_ID, paystackStatus: 'success', donorEmail: null } }),
    ]);

    const totalNaira = Math.round((totalAll._sum.amount ?? 0) / 100);
    const thisMonthNaira = Math.round((thisMonth._sum.amount ?? 0) / 100);
    const lastMonthNaira = Math.round((lastMonth._sum.amount ?? 0) / 100);
    const thisYearNaira = Math.round((thisYear._sum.amount ?? 0) / 100);
    const totalCount = totalAll._count._all;
    const momChange = lastMonthNaira === 0 ? 0 : Math.round(((thisMonthNaira - lastMonthNaira) / lastMonthNaira) * 100);
    const anonymousPct = totalCount > 0 ? Math.round((anonymous / totalCount) * 100) : 0;

    return {
      totalNaira,
      thisMonthNaira,
      lastMonthNaira,
      thisYearNaira,
      totalCount,
      momChange,
      uniqueDonors: uniqueEmails.length,
      anonymous,
      anonymousPct,
    };
  }

  async getTopDonors(limit = 10) {
    const records = await this.prisma.givingRecord.groupBy({
      by: ['donorEmail', 'donorName'],
      where: { tenantId: TENANT_ID, paystackStatus: 'success', donorEmail: { not: null } },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });
    return records.map((r: any) => ({ name: r.donorName || r.donorEmail || 'Unknown', email: r.donorEmail, amountNaira: Math.round((r._sum.amount ?? 0) / 100), count: r._count._all }));
  }

  private async computeForMember(memberId: string) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [totalServices, attended, memberData] = await Promise.all([
      this.prisma.service.count({ where: { tenantId: TENANT_ID, scheduledAt: { gte: ninetyDaysAgo } } }),
      this.prisma.attendanceRecord.count({ where: { tenantId: TENANT_ID, memberId, present: true, Service: { scheduledAt: { gte: ninetyDaysAgo } } } }),
      this.prisma.member.findUnique({ where: { id: memberId }, select: { email: true } }),
    ]);

    const attendancePct = totalServices > 0 ? attended / totalServices : 0;
    const attendanceScore = Math.round(Math.min(attendancePct * 40, 40));

    const [sermonPlays, bookmarks, reactions, notes] = await Promise.all([
      this.prisma.listenProgress.count({ where: { tenantId: TENANT_ID, memberId, positionSec: { gt: 0 }, updatedAt: { gte: ninetyDaysAgo } } }),
      this.prisma.sermonBookmark.count({ where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } } }),
      this.prisma.sermonReaction.count({ where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } } }),
      this.prisma.sermonNote.count({ where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } } }),
    ]);
    const sermonScore = Math.min(sermonPlays * 3 + bookmarks * 5 + reactions * 2 + notes * 4, 30);

    let givingCount = 0;
    if (memberData?.email) {
      givingCount = await this.prisma.givingRecord.count({ where: { tenantId: TENANT_ID, paystackStatus: 'success', donorEmail: memberData.email, createdAt: { gte: ninetyDaysAgo } } });
    }
    const givingScore = Math.min(givingCount * 5, 20);

    const responses = await this.prisma.discussionResponse.count({ where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } } });
    const communityScore = Math.min(responses * 5, 10);

    const score = attendanceScore + sermonScore + givingScore + communityScore;
    return { memberId, score, attendanceScore, sermonScore, givingScore, communityScore };
  }

  async refreshEngagementScores() {
    const members = await this.prisma.member.findMany({ where: { tenantId: TENANT_ID, status: 'ACTIVE' }, select: { id: true } });

    const results = await Promise.all(members.map((m: any) => this.computeForMember(m.id)));

    await Promise.all(results.map((r) => this.prisma.engagementScore.upsert({
      where: { memberId: r.memberId },
      update: { score: r.score, attendanceScore: r.attendanceScore, sermonScore: r.sermonScore, givingScore: r.givingScore, communityScore: r.communityScore, computedAt: new Date() },
      create: { id: randomUUID(), tenantId: TENANT_ID, memberId: r.memberId, score: r.score, attendanceScore: r.attendanceScore, sermonScore: r.sermonScore, givingScore: r.givingScore, communityScore: r.communityScore },
    })));

    return results;
  }

  async getEngagementLeaderboard(limit = 25) {
    const scores = await this.prisma.engagementScore.findMany({ where: { tenantId: TENANT_ID }, orderBy: { score: 'desc' }, take: limit, include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } } });
    return scores.map((s: any) => ({ memberId: s.memberId, name: `${s.Member.firstName} ${s.Member.lastName}`, photoUrl: s.Member.photoUrl, score: s.score, attendanceScore: s.attendanceScore, sermonScore: s.sermonScore, givingScore: s.givingScore, communityScore: s.communityScore, computedAt: s.computedAt?.toISOString() }));
  }

  async getAtRiskMembers() {
    const scores = await this.prisma.engagementScore.findMany({ where: { tenantId: TENANT_ID, score: { lt: 30 } }, orderBy: { score: 'asc' }, include: { Member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true } } } });
    return scores.map((s: any) => ({ memberId: s.memberId, name: `${s.Member.firstName} ${s.Member.lastName}`, email: s.Member.email, phone: s.Member.phone, photoUrl: s.Member.photoUrl, score: s.score }));
  }

  async getEngagementDistribution() {
    const [high, medHigh, med, low] = await Promise.all([
      this.prisma.engagementScore.count({ where: { tenantId: TENANT_ID, score: { gte: 70 } } }),
      this.prisma.engagementScore.count({ where: { tenantId: TENANT_ID, score: { gte: 50, lt: 70 } } }),
      this.prisma.engagementScore.count({ where: { tenantId: TENANT_ID, score: { gte: 30, lt: 50 } } }),
      this.prisma.engagementScore.count({ where: { tenantId: TENANT_ID, score: { lt: 30 } } }),
    ]);
    return [
      { label: 'Highly Engaged', range: '70–100', value: high, color: 'bg-green-500' },
      { label: 'Engaged', range: '50–69', value: medHigh, color: 'bg-blue-500' },
      { label: 'Needs Attention', range: '30–49', value: med, color: 'bg-yellow-500' },
      { label: 'At Risk', range: '0–29', value: low, color: 'bg-red-500' },
    ];
  }

  async getEngagementSummary() {
    const [total, scored, avgResult] = await Promise.all([
      this.prisma.member.count({ where: { tenantId: TENANT_ID, status: 'ACTIVE' } }),
      this.prisma.engagementScore.count({ where: { tenantId: TENANT_ID } }),
      this.prisma.engagementScore.aggregate({ where: { tenantId: TENANT_ID }, _avg: { score: true } }),
    ]);
    return { totalMembers: total, scoredMembers: scored, avgScore: Math.round(avgResult._avg.score ?? 0), unscored: total - scored };
  }
}
