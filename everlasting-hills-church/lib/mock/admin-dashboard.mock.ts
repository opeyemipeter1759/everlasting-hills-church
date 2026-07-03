/**
 * Mock data for the Super Admin dashboard overview.
 *
 * Shaped to mirror what a future `GET /admin/dashboard` endpoint would return, so the
 * UI can swap `getAdminDashboardMock()` for a real `apiClient.get('/admin/dashboard')`
 * with no component changes. Keep this the single source of dashboard data.
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
  // Category breakdown (from the usher headcount). Lets the growth surface show
  // men / women / children / first-timers over time, not just the total.
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

export interface UpcomingEvent {
  id: string;
  title: string;
  when: string;
}

export type ActivityType = "member" | "sermon" | "attendance" | "prayer";

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
  upcomingEvents: UpcomingEvent[];
  pastoralCare: { prayerRequests: number; counseling: number; hospitalVisits: number };
  celebrations: { birthdaysToday: number; anniversaries: number };
  ministryUnits: MinistryUnit[];
  recentActivities: ActivityItem[];
}

const MOCK: AdminDashboardData = {
  stats: [
    { key: "members", label: "Members", value: 1284, trend: { value: 4.2, direction: "up" } },
    { key: "attendance", label: "Attendance", value: 612, trend: { value: 11, direction: "up" } },
    { key: "visitors", label: "Visitors", value: 38, trend: { value: 6, direction: "down" } },
    { key: "volunteers", label: "Service Team", value: 96, trend: { value: 3, direction: "up" } },
    { key: "events", label: "Events", value: 7, trend: { value: 2, direction: "up" } },
    { key: "sermons", label: "Sermons", value: 142, trend: { value: 5, direction: "up" } },
  ],
  giving: {
    thisMonth: 4_850_000,
    currency: "₦",
    trend: { value: 8, direction: "up" },
    breakdown: [
      { label: "Tithes", value: 2_900_000 },
      { label: "Offerings", value: 1_200_000 },
      { label: "Online", value: 750_000 },
    ],
  },
  aiInsights: {
    attendanceChange: 11,
    visitorRetentionChange: -6,
    membersNeedingFollowUp: 14,
  },
  attendanceTrend: [
    { label: "Apr 5", value: 420, serviceType: "SUNDAY", men: 126, women: 147, children: 147, firstTimers: 17 },
    { label: "Apr 8", value: 180, serviceType: "WEDNESDAY", men: 54, women: 63, children: 63, firstTimers: 8 },
    { label: "Apr 12", value: 455, serviceType: "SUNDAY", men: 137, women: 159, children: 159, firstTimers: 18 },
    { label: "Apr 15", value: 205, serviceType: "WEDNESDAY", men: 62, women: 72, children: 71, firstTimers: 9 },
    { label: "Apr 19", value: 472, serviceType: "SUNDAY", men: 142, women: 165, children: 165, firstTimers: 19 },
    { label: "Apr 22", value: 214, serviceType: "WEDNESDAY", men: 64, women: 75, children: 75, firstTimers: 10 },
    { label: "Apr 26", value: 510, serviceType: "SUNDAY", men: 153, women: 179, children: 178, firstTimers: 22 },
    { label: "Apr 29", value: 232, serviceType: "WEDNESDAY", men: 70, women: 81, children: 81, firstTimers: 11 },
    { label: "May 3", value: 498, serviceType: "SUNDAY", men: 149, women: 174, children: 175, firstTimers: 20 },
    { label: "May 6", value: 221, serviceType: "WEDNESDAY", men: 66, women: 77, children: 78, firstTimers: 10 },
    { label: "May 10", value: 540, serviceType: "SUNDAY", men: 162, women: 189, children: 189, firstTimers: 24 },
    { label: "May 13", value: 244, serviceType: "WEDNESDAY", men: 73, women: 85, children: 86, firstTimers: 12 },
    { label: "May 17", value: 576, serviceType: "SUNDAY", men: 173, women: 202, children: 201, firstTimers: 26 },
    { label: "May 20", value: 258, serviceType: "WEDNESDAY", men: 77, women: 90, children: 91, firstTimers: 13 },
    { label: "May 24", value: 612, serviceType: "SUNDAY", men: 184, women: 214, children: 214, firstTimers: 30 },
    { label: "May 27", value: 271, serviceType: "WEDNESDAY", men: 81, women: 95, children: 95, firstTimers: 15 },
  ],
  firstTimerFunnel: [
    { label: "Registered", value: 19 },
    { label: "Contacted", value: 17 },
    { label: "Followed Up", value: 13 },
    { label: "Returned", value: 9 },
    { label: "Joined Class", value: 5 },
  ],
  upcomingEvents: [
    { id: "e1", title: "Prayer School", when: "Saturday · 10:00 AM" },
    { id: "e2", title: "Church Anniversary", when: "June 15" },
  ],
  pastoralCare: { prayerRequests: 8, counseling: 3, hospitalVisits: 2 },
  celebrations: { birthdaysToday: 3, anniversaries: 1 },
  ministryUnits: [
    { name: "Worship", members: 24, attendance: 87 },
    { name: "Media", members: 14, attendance: 92 },
    { name: "Ushering", members: 18, attendance: 94 },
    { name: "Children", members: 22, attendance: 80 },
    { name: "Follow-up", members: 10, attendance: 76 },
  ],
  recentActivities: [
    { id: "a1", type: "member", text: "John Doe registered as a member", timeAgo: "Just now" },
    { id: "a2", type: "sermon", text: "New sermon uploaded", timeAgo: "25 minutes ago" },
    { id: "a3", type: "attendance", text: "Attendance report submitted", timeAgo: "2 hours ago" },
    { id: "a4", type: "prayer", text: "Prayer request received", timeAgo: "5 hours ago" },
  ],
};

/**
 * Resolve the dashboard payload. Simulates a network round-trip so the UI exercises
 * its loading state. Replace the body with `apiClient.get('/admin/dashboard')` when
 * the endpoint exists — the return type is the contract.
 */
export function getAdminDashboardMock(): Promise<AdminDashboardData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK), 450);
  });
}
