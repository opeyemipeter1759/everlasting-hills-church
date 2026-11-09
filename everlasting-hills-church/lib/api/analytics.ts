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

/** GET /analytics/attendance-page: every part that follows the page filter; a failed part is null and named in `unavailable`. */
export interface AttendancePageData {
  overview: AnalyticsStats | null; trend: TrendPoint[] | null; split: SplitData | null; rateTrend: RatePoint[] | null;
  absenteeTrend: AbsenteePoint[] | null; serviceComparison: SvcComparison[] | null; memberGrowth: GrowthPoint[] | null;
  leaderboard: LeaderboardRow[] | null; firstTimers: FirstTimer[] | null; retention: RetentionData | null; peakHours: PeakHour[] | null;
  consistency: ConsistencyRow[] | null; serviceHealth: ServiceHealth[] | null; alerts: AnalyticsAlert[] | null;
  unavailable: string[];
}
type Part = Exclude<keyof AttendancePageData, "unavailable">;

/**
 * One request for the whole page. Each chart's hook below is a view of it
 * (same key), so the charts share that request and refresh together when the
 * filter changes. A part the server could not load surfaces as that chart's error.
 */
const attendancePage = (f: AnalyticsFilter) => ({
  ...QUERY_OPTS,
  queryKey: ["analytics", "attendance-page", ...filterKey(f)],
  queryFn: () => api.get<AttendancePageData>("/analytics/attendance-page", filterParams(f)),
});
function part<K extends Part>(key: K) {
  return (d: AttendancePageData) => {
    if (d.unavailable.includes(key) || d[key] === null) throw new Error(`Could not load ${key}`);
    return d[key] as NonNullable<AttendancePageData[K]>;
  };
}
const view = <K extends Part>(key: K) => (f: AnalyticsFilter) => useQuery({ ...attendancePage(f), select: part(key) });

export const useAnalyticsOverview = view("overview");
export const useAnalyticsTrend = view("trend");
export const useAnalyticsSplit = view("split");
export const useAnalyticsRateTrend = view("rateTrend");
export const useAnalyticsAbsentee = view("absenteeTrend");
export const useAnalyticsSvcCompare = view("serviceComparison");
export const useAnalyticsMemberGrowth = view("memberGrowth");
export const useAnalyticsFirstTimers = view("firstTimers");
export const useAnalyticsRetention = view("retention");
export const useAnalyticsPeakHours = view("peakHours");
export const useAnalyticsServiceHealth = view("serviceHealth");
export const useAnalyticsAlerts = view("alerts");
/** The page loads the top 10, so picking top 3/5/10 trims it rather than refetching. */
export const useAnalyticsLeaderboard = (f: AnalyticsFilter, limit = 10) =>
  useQuery({ ...attendancePage(f), select: (d: AttendancePageData) => part("leaderboard")(d).slice(0, limit) });
export const useAnalyticsConsistency = (f: AnalyticsFilter, limit = 10) =>
  useQuery({ ...attendancePage(f), select: (d: AttendancePageData) => part("consistency")(d).slice(0, limit) });

// The heatmap (own year picker) and the period comparison (own two periods) change independently of the page filter.
export const useAnalyticsHeatmap     = (year: number, serviceType?: ServiceTypeFilter) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","heatmap",year,serviceType], queryFn: () => api.get<HeatmapPoint[]>("/analytics/heatmap", { year, ...(serviceType && serviceType !== "all" ? { serviceType } : {}) }) });
export const useAnalyticsCompare     = (a: Record<string,string>, b: Record<string,string>) => useQuery({ ...QUERY_OPTS, queryKey: ["analytics","compare",a,b], queryFn: () => api.get("/analytics/compare", { periodA: a.period, dateFromA: a.dateFrom, dateToA: a.dateTo, periodB: b.period, dateFromB: b.dateFrom, dateToB: b.dateTo }) });

export const MOCK_ALERTS: AnalyticsAlert[] = [
  { id:"1",severity:"warning",type:"AT_RISK",message:"5 members absent 3+ consecutive weeks",timestamp:"2026-06-19T10:00:00Z"},
  { id:"2",severity:"info",type:"MILESTONE",message:"Sunday service hit 90% attendance",timestamp:"2026-06-15T11:30:00Z"},
  { id:"3",severity:"warning",type:"LOW_TURNOUT",message:"Wednesday service had low turnout",timestamp:"2026-06-18T20:00:00Z"},
];
