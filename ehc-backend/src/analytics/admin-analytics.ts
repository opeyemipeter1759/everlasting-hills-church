import { PrismaService } from '../prisma/prisma.service';

export function getLast6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - (5 - i));
    const start = new Date(d);
    const end = new Date(d);
    end.setMonth(end.getMonth() + 1);
    return {
      label: start.toLocaleDateString('en-GB', { month: 'short' }),
      start,
      end,
    };
  });
}

/**
 * Was previously fetching this data via 17 separate Supabase PostgREST calls
 * through a module-level `new PrismaClient()` (leaked, never disconnected, and
 * outside Nest's connection pool) — even though every one of these tables is
 * already queried directly via Prisma everywhere else in the app. Now a single
 * batch of parallel Prisma queries against the same connection pool the rest
 * of the app uses.
 */
export async function fetchAdminAnalytics(prisma: PrismaService, tenantId: string) {
  const months = getLast6Months();
  const sixMonthsAgo = months[0].start;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [
    totalMembers,
    totalVisitors,
    totalPrayers,
    recentMembers,
    visitors,
    prayers,
    givingAgg,
    recentServices,
    newMembersThisMonth,
    newMembersLastMonth,
    newMembersThisYear,
    newMembersLastYear,
    visitorsToday,
    visitorsYesterday,
    visitorsThisMonth,
    visitorsLastMonth,
    visitorsThisYear,
    visitorsLastYear,
  ] = await Promise.all([
    prisma.member.count({ where: { tenantId } }),
    prisma.visitor.count({ where: { tenantId } }),
    prisma.prayerRequest.count({ where: { tenantId } }),
    prisma.member.findMany({ where: { tenantId, joinedAt: { gte: sixMonthsAgo } }, select: { joinedAt: true } }),
    prisma.visitor.findMany({ where: { tenantId }, select: { membershipInterest: true, howDidYouLearn: true, attendanceType: true } }),
    prisma.prayerRequest.findMany({ where: { tenantId, submittedAt: { gte: sixMonthsAgo } }, select: { submittedAt: true } }),
    prisma.givingRecord.aggregate({ where: { tenantId, paystackStatus: 'success' }, _sum: { amount: true } }),
    prisma.service.findMany({
      where: { tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: 8,
      include: { _count: { select: { AttendanceRecord: true } } },
    }),
    prisma.member.count({ where: { tenantId, joinedAt: { gte: monthStart } } }),
    prisma.member.count({ where: { tenantId, joinedAt: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.member.count({ where: { tenantId, joinedAt: { gte: yearStart } } }),
    prisma.member.count({ where: { tenantId, joinedAt: { gte: lastYearStart, lt: yearStart } } }),
    prisma.visitor.count({ where: { tenantId, submittedAt: { gte: todayStart } } }),
    prisma.visitor.count({ where: { tenantId, submittedAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.visitor.count({ where: { tenantId, submittedAt: { gte: monthStart } } }),
    prisma.visitor.count({ where: { tenantId, submittedAt: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.visitor.count({ where: { tenantId, submittedAt: { gte: yearStart } } }),
    prisma.visitor.count({ where: { tenantId, submittedAt: { gte: lastYearStart, lt: yearStart } } }),
  ]);

  const memberGrowth = months.map((m) => ({
    label: m.label,
    value: recentMembers.filter((mem) => mem.joinedAt >= m.start && mem.joinedAt < m.end).length,
  }));

  const attendanceTrend = [...recentServices].reverse().map((s) => ({
    label: s.scheduledAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: s._count?.AttendanceRecord ?? 0,
  }));

  const sourceMap: Record<string, number> = {};
  visitors.forEach((v) => {
    const key = v.howDidYouLearn?.trim() || 'Not specified';
    sourceMap[key] = (sourceMap[key] ?? 0) + 1;
  });
  const visitorSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const inPerson = visitors.filter((v) => v.attendanceType?.toLowerCase().includes('person')).length;
  const online = visitors.filter((v) => v.attendanceType?.toLowerCase().includes('online')).length;
  const unspecified = visitors.length - inPerson - online;

  const interested = visitors.filter((v) => v.membershipInterest === 'Yes').length;
  const notInterested = visitors.length - interested;

  const prayersByMonth = months.map((m) => ({
    label: m.label,
    value: prayers.filter((p) => p.submittedAt >= m.start && p.submittedAt < m.end).length,
  }));

  const totalGivingNaira = Math.round((givingAgg._sum.amount ?? 0) / 100);

  const thisMonthGrowth = memberGrowth[5]?.value ?? 0;
  const lastMonthGrowth = memberGrowth[4]?.value ?? 0;
  const memberTrend = lastMonthGrowth === 0 ? 0 : Math.round(((thisMonthGrowth - lastMonthGrowth) / lastMonthGrowth) * 100);

  const avgAttendance = recentServices.length === 0
    ? 0
    : Math.round(recentServices.reduce((s, sv) => s + (sv._count?.AttendanceRecord ?? 0), 0) / recentServices.length);

  return {
    totalMembers,
    totalVisitors,
    totalPrayers,
    totalGivingNaira,
    avgAttendance,
    memberGrowth,
    attendanceTrend,
    visitorSources,
    prayersByMonth,
    inPerson,
    online,
    unspecified,
    interested,
    notInterested,
    memberTrend,
    newMembersThisMonth,
    newMembersLastMonth,
    newMembersThisYear,
    newMembersLastYear,
    visitorsToday,
    visitorsYesterday,
    visitorsThisMonth,
    visitorsLastMonth,
    visitorsThisYear,
    visitorsLastYear,
  };
}

export type AdminAnalyticsData = Awaited<ReturnType<typeof fetchAdminAnalytics>>;
