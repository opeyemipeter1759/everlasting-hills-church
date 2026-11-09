"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { timeAgo } from "@/lib/utils/time";
import type { CalendarSummary } from "@/lib/api/calendar";
import type { AbsentMember, AdminDashboardData, AttendancePoint, SummaryStat } from "@/lib/types/admin-dashboard";

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
  userName: string;
  photoUrl: string | null;
  phone: string | null;
}

interface AtRiskResponse {
  absentConsecutiveWeeks: (AtRiskEntry & { consecutiveAbsences: number })[];
  neverAttended: (AtRiskEntry & { joinedAt: string })[];
  belowFiftyPercent: (AtRiskEntry & { rate: number })[];
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

/** GET /admin/home: each part is null when it failed (listed in `unavailable`)
 *  or, for giving and the audit log, when the viewer is below PASTOR. */
interface AdminHomeResponse {
  summary: { stats: SummaryStat[] } | null;
  attendanceTrend: { points: AttendancePoint[] } | null;
  upcomingBirthdays: UpcomingBirthday[] | null;
  anniversariesToday: unknown[] | null;
  givingSummary: { thisMonthNaira: number; momChange: number } | null;
  givingCategories: { category: string; amountNaira: number }[] | null;
  unassignedFollowUps: number | null;
  analytics: { pendingPrayers?: number; pendingQuestions?: number; draftTestimonials?: number } | null;
  openFollowUpTasks: number | null;
  atRisk: AtRiskResponse | null;
  units: { name: string; totalMembers: number; activeMembers: number }[] | null;
  recentActivity: AuditEntry[] | null;
  absentMembers: AbsentMember[] | null;
  calendar: CalendarSummary | null;
  unavailable: string[];
}

/**
 * Query key for the whole admin dashboard.
 *
 * It sits under ["admin"] on purpose: saving a headcount already calls
 * invalidateQueries({ queryKey: ["admin"] }), so the Attendance Trend picks up
 * a count an usher just recorded without a full reload.
 */
export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const;

/**
 * At-risk people, most urgent first. /admin/home carries who each person is,
 * why they were flagged and how to reach them, so an admin reading "8 at risk"
 * has somewhere to go; the count is derived from the same list.
 */
function atRiskPeople(atRisk: AtRiskResponse | null): AdminDashboardData["pastoralCare"]["atRisk"] {
  const people: AdminDashboardData["pastoralCare"]["atRisk"] = [];
  if (!atRisk) return people;
  const seen = new Set<string>();
  const add = (e: AtRiskEntry, reason: string, weight: number) => {
    if (seen.has(e.userId)) return;
    seen.add(e.userId);
    people.push({ id: e.userId, name: e.userName, photoUrl: e.photoUrl, phone: e.phone, reason, weight });
  };
  // Consecutive absence first: it is the most recent, most actionable signal.
  for (const e of atRisk.absentConsecutiveWeeks) add(e, `Missed ${e.consecutiveAbsences} in a row`, 1000 + e.consecutiveAbsences);
  for (const e of atRisk.neverAttended) add(e, "Never attended", 500);
  for (const e of atRisk.belowFiftyPercent) add(e, `${Math.round(e.rate * 100)}% attendance`, Math.round(100 - e.rate * 100));
  return people.sort((a, b) => b.weight - a.weight);
}

/**
 * The Super Admin dashboard overview, from one request (GET /admin/home).
 * A part that failed falls back to empty so the rest of the page still shows;
 * only the stat cards failing counts as the dashboard failing.
 */
async function fetchAdminDashboard(): Promise<AdminDashboardData | null> {
  const home = (await apiClient.get<AdminHomeResponse>("/admin/home")).data;
  if (home.unavailable.includes("summary")) throw new Error("Could not load the dashboard.");

  const stats = home.summary?.stats ?? [];
  const birthdays = home.upcomingBirthdays ?? [];
  const atRisk = atRiskPeople(home.atRisk);
  const { givingSummary, givingCategories } = home;

  const data: AdminDashboardData = {
    stats,
    attendanceTrend: home.attendanceTrend?.points ?? [],
    giving:
      givingSummary && givingCategories
        ? {
            thisMonth: givingSummary.thisMonthNaira,
            currency: "₦",
            trend: { value: Math.abs(givingSummary.momChange), direction: givingSummary.momChange < 0 ? "down" : "up" },
            breakdown: givingCategories.map((c) => ({ label: c.category, value: c.amountNaira })),
          }
        : null,
    aiInsights: {
      attendanceChange: signedTrend(stats, "attendance"),
      visitorRetentionChange: signedTrend(stats, "visitors"),
      membersNeedingFollowUp: home.unassignedFollowUps ?? 0,
    },
    pastoralCare: {
      // Pending, not every request ever submitted — this sits beside two
      // outstanding-work counts, and a lifetime total can never reach zero.
      prayerRequests: home.analytics?.pendingPrayers ?? 0,
      questions: home.analytics?.pendingQuestions ?? 0,
      testimonies: home.analytics?.draftTestimonials ?? 0,
      openFollowUps: home.openFollowUpTasks ?? 0,
      atRiskMembers: atRisk.length,
      atRisk,
    },
    celebrations: {
      birthdaysToday: birthdays.filter((b) => b.daysUntil === 0).length,
      anniversaries: home.anniversariesToday?.length ?? 0,
      upcomingBirthdays: birthdays,
    },
    ministryUnits: (home.units ?? []).map((u) => ({
      name: u.name,
      members: u.totalMembers,
      activeMembers: u.activeMembers,
      activePct: u.totalMembers > 0 ? Math.round((u.activeMembers / u.totalMembers) * 100) : 0,
    })),
    recentActivities:
      home.recentActivity?.map((entry) => ({
        id: entry.id,
        type: entry.entity,
        text: activityText(entry),
        timeAgo: timeAgo(entry.createdAt),
      })) ?? null,
    absentMembers: home.absentMembers,
    calendar: home.calendar,
  };

  // No stat cards means nothing has been recorded yet, which the dashboard
  // renders as an empty state rather than an error.
  return data.stats.length ? data : null;
}

export function useAdminDashboardData() {
  const query = useQuery({
    queryKey: ADMIN_DASHBOARD_KEY,
    queryFn: fetchAdminDashboard,
    // Long enough that moving between dashboard tabs does not re-fetch,
    // short enough that a count recorded a minute ago shows up.
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
