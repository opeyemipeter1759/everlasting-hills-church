/**
 * Types for the Super Admin dashboard overview. Shared by every card component
 * and by useAdminDashboardData, which assembles this shape from several real
 * backend endpoints (see that file for the mapping).
 */

export type TrendDirection = "up" | "down";

export interface Trend {
  /** Magnitude as a percentage, e.g. 11 → "11%". */
  value: number;
  direction: TrendDirection;
}

export type StatKey =
  | "members"
  | "attendance"
  | "visitors"
  | "volunteers"
  | "events"
  | "sermons";

export interface SummaryStat {
  key: StatKey;
  label: string;
  value: number;
  trend?: Trend;
  /** Optional sub-line under the label, e.g. "1/5 active · 20%". */
  note?: string;
}

export type ServiceTypeKey = "SUNDAY" | "WEDNESDAY" | "SPECIAL";

export interface AttendancePoint {
  label: string; // service label, e.g. "Apr 7"
  value: number; // total present (usher headcount)
  /** Which gathering this point represents — powers the Sunday/Wednesday filter. */
  serviceType?: ServiceTypeKey;
  /** ISO date of the service, for tooltips/sorting. */
  date?: string;
  men?: number;
  women?: number;
  children?: number;
  firstTimers?: number;
}

export interface FunnelStage {
  label: string;
  value: number;
}

export interface MinistryUnit {
  name: string;
  members: number;
  /** Attendance rate as a percentage (0–100). */
  attendance: number;
}

/** Any AuditLog entity name — the log isn't limited to a fixed set, so icon
 * lookup in RecentActivitiesCard falls back to a generic icon for the rest. */
export type ActivityType = string;

export interface ActivityItem {
  id: string;
  type: ActivityType;
  text: string;
  timeAgo: string;
}

export interface GivingBreakdown {
  label: string;
  value: number;
}

export interface AdminDashboardData {
  stats: SummaryStat[];
  giving: {
    thisMonth: number;
    currency: string;
    trend: Trend;
    breakdown: GivingBreakdown[];
  };
  aiInsights: {
    attendanceChange: number; // %
    visitorRetentionChange: number; // %
    membersNeedingFollowUp: number;
  };
  attendanceTrend: AttendancePoint[];
  firstTimerFunnel: FunnelStage[];
  pastoralCare: { prayerRequests: number; openFollowUps: number; atRiskMembers: number };
  celebrations: {
    birthdaysToday: number;
    anniversaries: number;
    upcomingBirthdays: Array<{ id: string; firstName: string; lastName: string; photoUrl: string | null; daysUntil: number }>;
  };
  ministryUnits: MinistryUnit[];
  recentActivities: ActivityItem[];
}
