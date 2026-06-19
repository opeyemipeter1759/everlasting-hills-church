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
interface AbsentRowApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}
interface VisitorRowApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  attendanceType: string | null;
  membershipInterest: string | null;
  howDidYouLearn: string | null;
  locatedInIbadan: boolean | null;
  bornAgain: string | null;
  occupation: string | null;
  submittedAt: string;
}

/**
 * Admin/Pastor/Super-Admin dashboard.
 *
 * 6 parallel fetches across analytics + attendance + members + visitors modules.
 * Each safeGet wrapper tolerates per-endpoint failure independently — one slow query
 * doesn't blank the whole dashboard.
 */
export async function loadAdminDashboard(me: MeResponse) {
  const [analytics, attendanceStats, members, birthdaysRaw, absentRaw, visitors] =
    await Promise.all([
      safeGet<AdminAnalytics>("/admin/analytics"),
      safeGet<AttendanceStats>("/attendance/stats"),
      safeGet<MemberRowApi[]>("/members?status=ACTIVE"),
      safeGet<BirthdayRowApi[]>("/members/birthdays/upcoming?daysAhead=7"),
      safeGet<AbsentRowApi[]>("/members/absent?missedSundays=3"),
      safeGet<VisitorRowApi[]>("/visitors?limit=10"),
    ]);

  const recentMembers = (members ?? []).slice(0, 10).map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    joinedAt: new Date(m.joinedAt),
  }));

  const recentVisitors = (visitors ?? []).map((v) => ({
    id: v.id,
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone,
    gender: v.gender,
    attendanceType: v.attendanceType,
    membershipInterest: v.membershipInterest,
    howDidYouLearn: v.howDidYouLearn,
    locatedInIbadan: v.locatedInIbadan,
    bornAgain: v.bornAgain,
    occupation: v.occupation,
    submittedAt: new Date(v.submittedAt),
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
      recentVisitors={recentVisitors}
      recentMembers={recentMembers}
      memberEmails={recentMembers.map((m) => m.email).filter((e): e is string => !!e)}
      birthdayFeed={birthdaysRaw ?? []}
      absentMembers={absentRaw ?? []}
    />
  );
}
