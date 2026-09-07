"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { timeAgo } from "@/lib/utils/time";
import type {
  AdminDashboardData,
  AttendancePoint,
  SummaryStat,
} from "@/lib/types/admin-dashboard";

export type DataStatus = "loading" | "error" | "empty" | "success";

interface UpcomingBirthday {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  daysUntil: number;
}

interface AtRiskEntry {
  userId: string;
}

interface AtRiskResponse {
  absentConsecutiveWeeks: AtRiskEntry[];
  neverAttended: AtRiskEntry[];
  belowFiftyPercent: AtRiskEntry[];
}

interface AuditEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
}

function signedTrend(stats: SummaryStat[], key: SummaryStat["key"]): number {
  const stat = stats.find((s) => s.key === key);
  if (!stat?.trend) return 0;
  return stat.trend.direction === "down" ? -stat.trend.value : stat.trend.value;
}

function verbFor(action: string): string {
  switch (action) {
    case "CREATE": return "created";
    case "UPDATE": return "updated";
    case "DELETE": return "deleted";
    case "PUBLISH": return "published";
    case "UNPUBLISH": return "unpublished";
    case "ROLLBACK": return "rolled back";
    default: return action.toLowerCase();
  }
}

/** "Christopher updated the Page" / "Someone created a Unit". */
function activityText(entry: AuditEntry): string {
  const who = entry.actorName ?? "Someone";
  return `${who} ${verbFor(entry.action)} ${entry.entity}`;
}

/**
 * Loads the Super Admin dashboard overview from real backend endpoints — no
 * mock/dummy data. Each section maps to an existing endpoint (see the comment
 * above each call); sections without a dedicated payload shape are assembled
 * client-side from list endpoints that already exist for their own pages.
 */
/**
 * Query key for the whole admin dashboard.
 *
 * It sits under ["admin"] on purpose: saving a headcount already calls
 * invalidateQueries({ queryKey: ["admin"] }), which did nothing while this
 * screen fetched by hand in a useEffect. An usher could record a count and the
 * Attendance Trend would keep showing the old one until a full reload.
 */
export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const;

async function fetchAdminDashboard(): Promise<AdminDashboardData | null> {
  const [
    summary,
    trend,
    upcomingBirthdays,
    anniversaries,
    givingSummary,
    givingCategories,
    unassignedFollowUps,
    firstTimerPipeline,
    adminAnalytics,
    openFollowUpTasks,
    atRisk,
    units,
    audit,
  ] = await Promise.all([
    apiClient.get<{ stats: SummaryStat[] }>("/admin/dashboard-summary"),
    // Every recorded headcount; the chart offers its own date-range filter,
    // so trimming the history here would just hide counts that were taken.
    apiClient.get<{ points: AttendancePoint[] }>("/admin/attendance-trend?limit=500"),
    apiClient.get<UpcomingBirthday[]>("/members/birthdays/upcoming?daysAhead=7"),
    apiClient.get<unknown[]>("/members/anniversaries/today"),
    apiClient.get<{ thisMonthNaira: number; momChange: number }>("/admin/giving/summary"),
    apiClient.get<{ category: string; amountNaira: number }[]>("/admin/giving/categories"),
    apiClient.get<unknown[]>("/follow-up?stage=UNASSIGNED"),
    apiClient.get<{ total: number; interestedCount: number; convertedCount: number }>("/admin/first-timer/pipeline"),
    apiClient.get<{ totalPrayers: number }>("/admin/analytics"),
    apiClient.get<unknown[]>("/members/follow-ups"),
    apiClient.get<AtRiskResponse>("/members/at-risk"),
    apiClient.get<{ name: string; totalMembers: number; activeMembers: number }[]>("/admin/units"),
    apiClient.get<AuditEntry[]>("/cms/audit?limit=10"),
  ]);

  const stats = summary.data?.stats ?? [];

  const atRiskUnion = new Set([
    ...atRisk.data.absentConsecutiveWeeks.map((e) => e.userId),
    ...atRisk.data.neverAttended.map((e) => e.userId),
    ...atRisk.data.belowFiftyPercent.map((e) => e.userId),
  ]);

  const data: AdminDashboardData = {
    stats,
    attendanceTrend: trend.data?.points ?? [],
    giving: {
      thisMonth: givingSummary.data.thisMonthNaira,
      currency: "₦",
      trend: {
        value: Math.abs(givingSummary.data.momChange),
        direction: givingSummary.data.momChange < 0 ? "down" : "up",
      },
      breakdown: givingCategories.data.map((c) => ({ label: c.category, value: c.amountNaira })),
    },
    aiInsights: {
      attendanceChange: signedTrend(stats, "attendance"),
      visitorRetentionChange: signedTrend(stats, "visitors"),
      membersNeedingFollowUp: unassignedFollowUps.data.length,
    },
    firstTimerFunnel: [
      { label: "Registered", value: firstTimerPipeline.data.total },
      { label: "Interested", value: firstTimerPipeline.data.interestedCount },
      { label: "Became Member", value: firstTimerPipeline.data.convertedCount },
    ],
    pastoralCare: {
      prayerRequests: adminAnalytics.data.totalPrayers,
      openFollowUps: openFollowUpTasks.data.length,
      atRiskMembers: atRiskUnion.size,
    },
    celebrations: {
      birthdaysToday: upcomingBirthdays.data.filter((b) => b.daysUntil === 0).length,
      anniversaries: anniversaries.data.length,
      upcomingBirthdays: upcomingBirthdays.data,
    },
    ministryUnits: units.data.map((u) => ({
      name: u.name,
      members: u.totalMembers,
      activeMembers: u.activeMembers,
      activePct: u.totalMembers > 0 ? Math.round((u.activeMembers / u.totalMembers) * 100) : 0,
    })),
    recentActivities: audit.data.map((entry) => ({
      id: entry.id,
      type: entry.entity,
      text: activityText(entry),
      timeAgo: timeAgo(entry.createdAt),
    })),
  };

  // No stat cards means nothing has been recorded yet, which the dashboard
  // renders as an empty state rather than an error.
  return data.stats.length ? data : null;
}

export function useAdminDashboardData() {
  const query = useQuery({
    queryKey: ADMIN_DASHBOARD_KEY,
    queryFn: fetchAdminDashboard,
    // Long enough that moving between dashboard tabs does not re-fetch ten
    // endpoints, short enough that a count recorded a minute ago shows up.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const status: DataStatus = query.isPending
    ? "loading"
    : query.isError
      ? "error"
      : query.data
        ? "success"
        : "empty";

  return {
    status,
    data: query.data ?? null,
    error: query.isError
      ? ((query.error as { message?: string })?.message ?? "Could not load the dashboard.")
      : null,
    refetch: query.refetch,
  };
}
