import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const db = new PrismaClient();
const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? '';

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

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) {
    throw new Error('Missing Supabase URL or service role key in env variables');
  }
  return createClient(url, key);
}

export async function fetchAdminAnalytics() {
  const supabase = createAdminClient();
  const months = getLast6Months();
  const sixMonthsAgo = months[0].start.toISOString();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [
    { count: totalMembers },
    { count: totalVisitors },
    { count: totalPrayers },
    { data: recentMembersData },
    { data: allVisitorsData },
    { data: prayerChartData },
    { data: givingData },
    recentServices,
    { count: newMembersThisMonthRaw },
    { count: newMembersLastMonthRaw },
    { count: newMembersThisYearRaw },
    { count: newMembersLastYearRaw },
    { count: visitorsTodayRaw },
    { count: visitorsYesterdayRaw },
    { count: visitorsThisMonthRaw },
    { count: visitorsLastMonthRaw },
    { count: visitorsThisYearRaw },
    { count: visitorsLastYearRaw },
  ] = await Promise.all([
    supabase.from('Member').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID),
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID),
    supabase.from('PrayerRequest').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID),
    supabase.from('Member').select('joinedAt').eq('tenantId', TENANT_ID).gte('joinedAt', sixMonthsAgo),
    supabase.from('Visitor').select('membershipInterest, howDidYouLearn, attendanceType').eq('tenantId', TENANT_ID),
    supabase.from('PrayerRequest').select('submittedAt').eq('tenantId', TENANT_ID).gte('submittedAt', sixMonthsAgo),
    supabase.from('GivingRecord').select('amount').eq('tenantId', TENANT_ID).eq('paystackStatus', 'success'),
    db.service.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { scheduledAt: 'desc' },
      take: 8,
      include: { _count: { select: { AttendanceRecord: true } } },
    }),
    // Member period counts
    supabase.from('Member').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('joinedAt', monthStart.toISOString()),
    supabase.from('Member').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('joinedAt', lastMonthStart.toISOString()).lt('joinedAt', monthStart.toISOString()),
    supabase.from('Member').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('joinedAt', yearStart.toISOString()),
    supabase.from('Member').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('joinedAt', lastYearStart.toISOString()).lt('joinedAt', yearStart.toISOString()),
    // Visitor period counts
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('submittedAt', todayStart.toISOString()),
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('submittedAt', yesterdayStart.toISOString()).lt('submittedAt', todayStart.toISOString()),
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('submittedAt', monthStart.toISOString()),
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('submittedAt', lastMonthStart.toISOString()).lt('submittedAt', monthStart.toISOString()),
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('submittedAt', yearStart.toISOString()),
    supabase.from('Visitor').select('*', { count: 'exact', head: true }).eq('tenantId', TENANT_ID).gte('submittedAt', lastYearStart.toISOString()).lt('submittedAt', yearStart.toISOString()),
  ]);

  const members = recentMembersData ?? [];
  const visitors = allVisitorsData ?? [];
  const prayers = prayerChartData ?? [];
  const giving = givingData ?? [];

  const memberGrowth = months.map((m) => ({
    label: m.label,
    value: members.filter((mem: any) => {
      const d = new Date(mem.joinedAt as string);
      return d >= m.start && d < m.end;
    }).length,
  }));

  const attendanceTrend = [...recentServices].reverse().map((s: any) => ({
    label: new Date(s.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: s._count?.AttendanceRecord ?? 0,
  }));

  const sourceMap: Record<string, number> = {};
  visitors.forEach((v: any) => {
    const key = (v.howDidYouLearn as string | null)?.trim() || 'Not specified';
    sourceMap[key] = (sourceMap[key] ?? 0) + 1;
  });
  const visitorSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const inPerson = visitors.filter((v: any) => (v.attendanceType as string | null)?.toLowerCase().includes('person')).length;
  const online = visitors.filter((v: any) => (v.attendanceType as string | null)?.toLowerCase().includes('online')).length;
  const unspecified = visitors.length - inPerson - online;

  const interested = visitors.filter((v: any) => v.membershipInterest === 'Yes').length;
  const notInterested = visitors.length - interested;

  const prayersByMonth = months.map((m) => ({
    label: m.label,
    value: prayers.filter((p: any) => {
      const d = new Date(p.submittedAt as string);
      return d >= m.start && d < m.end;
    }).length,
  }));

  const totalGivingNaira = Math.round(giving.reduce((s: number, g: any) => s + (g.amount as number), 0) / 100);

  const thisMonthGrowth = memberGrowth[5]?.value ?? 0;
  const lastMonthGrowth = memberGrowth[4]?.value ?? 0;
  const memberTrend = lastMonthGrowth === 0 ? 0 : Math.round(((thisMonthGrowth - lastMonthGrowth) / lastMonthGrowth) * 100);

  const avgAttendance = recentServices.length === 0 ? 0 : Math.round(recentServices.reduce((s: number, sv: any) => s + (sv._count?.AttendanceRecord ?? 0), 0) / recentServices.length);

  const newMembersThisMonth = newMembersThisMonthRaw ?? 0;
  const newMembersLastMonth = newMembersLastMonthRaw ?? 0;
  const newMembersThisYear = newMembersThisYearRaw ?? 0;
  const newMembersLastYear = newMembersLastYearRaw ?? 0;
  const visitorsToday = visitorsTodayRaw ?? 0;
  const visitorsYesterday = visitorsYesterdayRaw ?? 0;
  const visitorsThisMonth = visitorsThisMonthRaw ?? 0;
  const visitorsLastMonth = visitorsLastMonthRaw ?? 0;
  const visitorsThisYear = visitorsThisYearRaw ?? 0;
  const visitorsLastYear = visitorsLastYearRaw ?? 0;

  return {
    totalMembers: totalMembers ?? 0,
    totalVisitors: totalVisitors ?? 0,
    totalPrayers: totalPrayers ?? 0,
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
