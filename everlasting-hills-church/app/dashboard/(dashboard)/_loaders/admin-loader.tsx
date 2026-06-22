import AdminOverview from "@/components/dashboard/AdminOverview";
import { safeGet, type MeResponse } from "./shared";

interface AdminAnalytics {
  totalMembers: number;
  totalVisitors: number;
  totalPrayers: number;
  totalGivingNaira: number;
  avgAttendance: number;
  newMembersThisMonth: number;
}
interface AttendanceStats {
  totalServices: number;
  todayCheckIns: number;
}
interface MemberRowApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  joinedAt: string;
}
interface BirthdayRowApi {
  id: string;
  firstName: string;
  lastName: string;
  daysUntil: number;
  photoUrl: string | null;
}

/**
 * Admin/Pastor/Super-Admin dashboard.
 *
 * Parallel fetches across analytics + attendance + members. The newcomers
 * (first-timers) module now lives on /dashboard/first-timers, and the follow-up
 * (absent members) status moved to /admin/dashboard — so this loader no longer
 * fetches visitors or absentees.
 */
export async function loadAdminDashboard(me: MeResponse) {
  const [analytics, attendanceStats, members, birthdaysRaw] = await Promise.all([
    safeGet<AdminAnalytics>("/admin/analytics"),
    safeGet<AttendanceStats>("/attendance/stats"),
    safeGet<MemberRowApi[]>("/members?status=ACTIVE"),
    safeGet<BirthdayRowApi[]>("/members/birthdays/upcoming?daysAhead=7"),
  ]);

  const recentMembers = (members ?? []).slice(0, 10).map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    joinedAt: new Date(m.joinedAt),
  }));

  return (
    <AdminOverview
      userName={me.member?.firstName ?? null}
      stats={{
        members: analytics?.totalMembers ?? 0,
        visitors: analytics?.totalVisitors ?? 0,
        todayCheckIns: attendanceStats?.todayCheckIns ?? 0,
        prayers: analytics?.totalPrayers ?? 0,
      }}
      recentMembers={recentMembers}
      birthdayFeed={birthdaysRaw ?? []}
    />
  );
}
