import MemberHome from "@/components/dashboard/member/MemberHome";
import { loadAdminDashboard } from "./_loaders/admin-loader";
import { loadMemberDashboard } from "./_loaders/member-loader";
import { loadUnitLeadDashboard } from "./_loaders/unit-lead-loader";
import { normalizeRole, safeGet, type MeResponse } from "./_loaders/shared";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };
export const dynamic = "force-dynamic"; // per-request cookies

/**
 * Dashboard router.
 *
 * Branches by role; each role has its own loader file in `_loaders/`. The `_` prefix
 * keeps Next.js from treating that folder as a route segment.
 *
 * Middleware already enforced JWT auth + minimum role (MEMBER) before this renders, so
 * we can trust `me.role` is at least MEMBER (or null for orphan accounts).
 */
export default async function DashboardPage() {
  const me = await safeGet<MeResponse>("/auth/me");

  if (!me) {
    // Authenticated user but /auth/me failed — render the empty member view so the
    // page still loads rather than crashing the error boundary.
    return (
      <MemberHome
        userEmail=""
        memberDisplayId="EHC-NEW"
        sermonStreak={0}
        bookmarks={[]}
        listenHistory={[]}
        birthdayDaysUntil={null}
        attendanceRate={0}
        attendanceCount={0}
        streakWeeks={0}
        lastServiceDate={null}
        nextService={null}
        hasCheckedInToday={false}
        todayService={null}
        prayerCount={0}
        recentServices={[]}
        monthlyAttendance={[]}
      />
    );
  }

  const role = normalizeRole(me.role);

  if (role === "ADMIN" || role === "PASTOR" || role === "SUPER_ADMIN") {
    return loadAdminDashboard(me);
  }
  if (role === "UNIT_LEAD") {
    return loadUnitLeadDashboard(me);
  }
  return loadMemberDashboard(me);
}
