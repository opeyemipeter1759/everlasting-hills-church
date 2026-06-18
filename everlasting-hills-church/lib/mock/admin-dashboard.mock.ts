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
}

export interface AttendancePoint {
  label: string; // service label, e.g. "Apr 7"
  value: number;
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
    { key: "volunteers", label: "Volunteers", value: 96, trend: { value: 3, direction: "up" } },
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
    { label: "Apr 7", value: 420 },
    { label: "Apr 14", value: 455 },
    { label: "Apr 21", value: 472 },
    { label: "Apr 28", value: 510 },
    { label: "May 5", value: 498 },
    { label: "May 12", value: 540 },
    { label: "May 19", value: 576 },
    { label: "May 26", value: 612 },
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
