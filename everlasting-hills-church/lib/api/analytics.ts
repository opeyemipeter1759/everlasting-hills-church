import { useQuery } from "@tanstack/react-query";
import { api } from "./request";

export type Period = "today" | "week" | "month" | "year";
export type ServiceTypeFilter = "all" | "sunday" | "wednesday" | "special";

/** Universal analytics filter — use period OR dateFrom+dateTo (custom wins) */
export interface AnalyticsFilter {
  period?: Period;
  dateFrom?: string;      // "yyyy-MM-dd"
  dateTo?: string;        // "yyyy-MM-dd"
  serviceType?: ServiceTypeFilter;
}

export interface AnalyticsStats {
  attendanceRate: number; attendanceRateChange: number;
  totalPresent: number; totalPresentChange: number;
  totalAbsent: number;  totalAbsentChange: number;
  avgPerService: number; totalServicesHeld: number; totalServicesHeldChange: number;
  mostImproved: { name: string; rateJump: number } | null;
  dateRange?: { from: string; to: string };
}
export interface TrendPoint    { date: string; serviceKey: string; present: number; absent: number; total: number; rate: number }
export interface RatePoint     { label: string; rate: number }
export interface AbsenteePoint { label: string; absent: number; total: number; rate: number }
export interface PeakHour      { time: string; count: number }
export interface GrowthPoint   { label: string; totalMembers: number; newMembers: number }
export interface SvcComparison { serviceKey: string; present: number; absent: number; total: number; rate: number }
export interface LeaderboardRow{ userId: string; name: string; photoUrl: string | null; rate: number; attended: number; total: number; currentStreak: number }
export interface ServiceHealth { serviceKey: string; healthScore: number; avgRate: number; trend: number; sessionsReviewed: number }
export interface RetentionData { rate: number; retained: number; lost: number; newAttendees: number; prevPeriodCount: number; currPeriodCount: number }
export interface FirstTimer    { userId: string; name: string; photoUrl: string | null; firstAttendedAt: string; serviceKey: string }
export interface ConsistencyRow{ userId: string; name: string; photoUrl: string | null; rate: number; attended: number; total: number; currentStreak: number; longestStreak: number; missedStreak: number; consistencyScore: number }
export interface AnalyticsAlert{ id: string; severity: "warning"|"info"; type: "LOW_TURNOUT"|"MILESTONE"|"AT_RISK"|"SESSION"; message: string; memberName?: string | null; memberPhotoUrl?: string | null; timestamp: string }
export interface HeatmapPoint  { date: string; serviceKey: string; present: number; total: number; rate: number }
export interface SplitData     { present: number; absent: number; total: number; rate: number }

function filterKey(f: AnalyticsFilter) {
  return [f.period, f.dateFrom, f.dateTo, f.serviceType].filter(Boolean);
}
function filterParams(f: AnalyticsFilter) {
  const p: Record<string, string> = {};
  if (f.period)      p.period      = f.period;
  if (f.dateFrom)    p.dateFrom    = f.dateFrom;
  if (f.dateTo)      p.dateTo      = f.dateTo;
  if (f.serviceType && f.serviceType !== "all") p.serviceType = f.serviceType;
  return p;
}

// Cache analytics results for 2 minutes; retry once only so a pool-exhaustion spike
// doesn't spiral into repeated hammering of the DB.
const QUERY_OPTS = { staleTime: 2 * 60_000, retry: 1 } as const;

export const useAnalyticsOverview    = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","overview",...filterKey(f)],    queryFn: () => api.get<AnalyticsStats>("/analytics/overview",        filterParams(f)) });
export const useAnalyticsTrend       = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","trend",...filterKey(f)],       queryFn: () => api.get<TrendPoint[]>("/analytics/trend",             filterParams(f)) });
export const useAnalyticsSplit       = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","split",...filterKey(f)],       queryFn: () => api.get<SplitData>("/analytics/split",                filterParams(f)) });
export const useAnalyticsRateTrend   = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","rate-trend",...filterKey(f)],  queryFn: () => api.get<RatePoint[]>("/analytics/rate-trend",         filterParams(f)) });
export const useAnalyticsAbsentee    = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","absentee",...filterKey(f)],    queryFn: () => api.get<AbsenteePoint[]>("/analytics/absentee-trend", filterParams(f)) });
export const useAnalyticsSvcCompare  = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","svc",...filterKey(f)],         queryFn: () => api.get<SvcComparison[]>("/analytics/service-comparison", filterParams(f)) });
export const useAnalyticsMemberGrowth= (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","growth",...filterKey(f)],      queryFn: () => api.get<GrowthPoint[]>("/analytics/member-growth",   filterParams(f)) });
export const useAnalyticsLeaderboard = (f: AnalyticsFilter, limit = 10) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","leader",...filterKey(f),limit], queryFn: () => api.get<LeaderboardRow[]>("/analytics/leaderboard", { ...filterParams(f), limit }) });
export const useAnalyticsFirstTimers = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","ft",...filterKey(f)],          queryFn: () => api.get<FirstTimer[]>("/analytics/first-timers",     filterParams(f)) });
export const useAnalyticsRetention   = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","retain",...filterKey(f)],      queryFn: () => api.get<RetentionData>("/analytics/retention",        filterParams(f)) });
export const useAnalyticsHeatmap     = (year: number, serviceType?: ServiceTypeFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","heatmap",year,serviceType], queryFn: () => api.get<HeatmapPoint[]>("/analytics/heatmap", { year, ...(serviceType && serviceType !== "all" ? { serviceType } : {}) }) });
export const useAnalyticsPeakHours   = (f: AnalyticsFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","peak",...filterKey(f)],        queryFn: () => api.get<PeakHour[]>("/analytics/peak-hours",          filterParams(f)) });
export const useAnalyticsConsistency = (f: AnalyticsFilter, limit = 10) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","consist",...filterKey(f),limit], queryFn: () => api.get<ConsistencyRow[]>("/analytics/consistency", { ...filterParams(f), limit }) });
export const useAnalyticsServiceHealth = () => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","health"], queryFn: () => api.get<ServiceHealth[]>("/analytics/service-health") });
export const useAnalyticsCompare     = (a: Record<string,string>, b: Record<string,string>) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","compare",a,b], queryFn: () => api.get("/analytics/compare", { periodA: a.period, dateFromA: a.dateFrom, dateToA: a.dateTo, periodB: b.period, dateFromB: b.dateFrom, dateToB: b.dateTo }) });
export const useAnalyticsAlerts      = () => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","alerts"], queryFn: () => api.get<AnalyticsAlert[]>("/analytics/alerts") });

export const MOCK_ALERTS: AnalyticsAlert[] = [
  { id:"1",severity:"warning",type:"AT_RISK",message:"5 members absent 3+ consecutive weeks",timestamp:"2026-06-19T10:00:00Z"},
  { id:"2",severity:"info",type:"MILESTONE",message:"Sunday service hit 90% attendance",timestamp:"2026-06-15T11:30:00Z"},
  { id:"3",severity:"warning",type:"LOW_TURNOUT",message:"Wednesday service had low turnout",timestamp:"2026-06-18T20:00:00Z"},
];
