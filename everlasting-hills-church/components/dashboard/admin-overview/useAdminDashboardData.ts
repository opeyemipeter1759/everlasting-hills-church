"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { timeAgo } from "@/lib/utils/time";
import type {
  AdminDashboardData,
  AttendancePoint,
  SummaryStat,
} from "@/lib/types/admin-dashboard";

export type DataStatus = "loading" | "error" | "empty" | "success";

interface State {
  status: DataStatus;
  data: AdminDashboardData | null;
  error: string | null;
}

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
export function useAdminDashboardData() {
  const [state, setState] = useState<State>({ status: "loading", data: null, error: null });

  const load = useCallback(async () => {
    setState({ status: "loading", data: null, error: null });
    try {
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
        apiClient.get<{ points: AttendancePoint[] }>("/admin/attendance-trend"),
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

      if (!data.stats.length) {
        setState({ status: "empty", data: null, error: null });
        return;
      }
      setState({ status: "success", data, error: null });
    } catch (err) {
      setState({
        status: "error",
        data: null,
        error: (err as { message?: string }).message ?? "Could not load the dashboard.",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
