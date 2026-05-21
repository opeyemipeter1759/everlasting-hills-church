import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import {
  getMemberAttendance,
  getTodayService,
  getNextService,
  countTotalServices,
  getRecentServicesStats,
} from "@/services/attendance.service";
import { getLast6Months } from "@/services/analytics.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/rbac";
import MemberShell from "@/components/dashboard/member/MemberShell";
import MemberHome from "@/components/dashboard/member/MemberHome";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMemberDisplayId(id: string): string {
  return `EHC-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

function calculateStreakWeeks(
  records: Array<{ service: { scheduledAt: Date } }>
): number {
  if (!records.length) return 0;
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  const weekStarts = new Set<number>();
  for (const r of records) {
    const d = new Date(r.service.scheduledAt);
    d.setHours(0, 0, 0, 0);
    const weekStart = new Date(d.getTime() - d.getDay() * 24 * 60 * 60 * 1000);
    weekStarts.add(weekStart.getTime());
  }

  const sorted = Array.from(weekStarts).sort((a, b) => b - a);

  // Only count streak from a recent week
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentWeekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
  if (sorted[0] < currentWeekStart.getTime() - MS_PER_WEEK) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === MS_PER_WEEK) streak++;
    else break;
  }
  return streak;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // First-time login: new member accounts have this flag set until they choose a password
  if (user.user_metadata?.needs_password_change) {
    redirect("/change-password");
  }

  const [profileWithMember, attendanceRecords, todayService, nextService, totalServices, recentServices] =
    await Promise.all([
      getMemberWithProfile(user.id),
      getMemberAttendance(user.id),
      getTodayService(),
      getNextService(),
      countTotalServices(),
      getRecentServicesStats(24),
    ]);

  // Admins go to the admin dashboard
  if (profileWithMember && isAdmin(profileWithMember.role)) {
    redirect("/dashboard");
  }

  const member = profileWithMember?.member ?? null;

  const memberData = member
    ? {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        address: member.address,
        dateOfBirth: member.dateOfBirth
          ? member.dateOfBirth.toISOString().split("T")[0]
          : null,
      }
    : null;

  // Attendance stats
  const attendanceCount = attendanceRecords.length;
  const attendanceRate =
    totalServices > 0
      ? Math.min(100, Math.round((attendanceCount / totalServices) * 100))
      : 0;
  const streakWeeks = calculateStreakWeeks(attendanceRecords);
  const lastRecord = attendanceRecords[0] ?? null;
  const lastServiceDate = lastRecord ? lastRecord.service.scheduledAt.toISOString() : null;

  const hasCheckedInToday = todayService
    ? attendanceRecords.some((r) => r.serviceId === todayService.id)
    : false;

  // Member display data
  const memberId = member?.id ?? user.id;
  const memberDisplayId = getMemberDisplayId(memberId);
  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : user.email ?? "Member";
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (user.email?.[0] ?? "M").toUpperCase();

  // Prayer request count
  let prayerCount = 0;
  if (member?.email) {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("PrayerRequest")
      .select("*", { count: "exact", head: true })
      .eq("tenantId", TENANT_ID)
      .eq("email", member.email);
    prayerCount = count ?? 0;
  }

  const recentServiceStats = recentServices.map((s) => ({
    name: s.name,
    scheduledAt: s.scheduledAt.toISOString(),
    totalAttended: s._count.attendance,
  }));

  // Monthly attendance (last 6 months)
  const months = getLast6Months();
  const attendedServiceIds = new Set(attendanceRecords.map((r) => r.serviceId));
  const monthlyAttendance = months.map((m) => {
    const monthServices = recentServices.filter((s) => {
      return s.scheduledAt >= m.start && s.scheduledAt < m.end;
    });
    const attended = monthServices.filter((s) => attendedServiceIds.has(s.id)).length;
    return { label: m.label, attended, total: monthServices.length };
  });

  return (
    <MemberShell
      memberDisplayId={memberDisplayId}
      displayName={displayName}
      initials={initials}
      email={user.email ?? ""}
    >
      <MemberHome
        member={memberData}
        userEmail={user.email ?? ""}
        memberDisplayId={memberDisplayId}
        attendanceRate={attendanceRate}
        attendanceCount={attendanceCount}
        streakWeeks={streakWeeks}
        lastServiceDate={lastServiceDate}
        nextService={
          nextService
            ? { name: nextService.name, scheduledAt: nextService.scheduledAt.toISOString() }
            : null
        }
        hasCheckedInToday={hasCheckedInToday}
        todayService={
          todayService ? { id: todayService.id, name: todayService.name } : null
        }
        prayerCount={prayerCount}
        recentServices={recentServiceStats}
        monthlyAttendance={monthlyAttendance}
      />
    </MemberShell>
  );
}
