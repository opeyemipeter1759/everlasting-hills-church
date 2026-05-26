import { LayoutDashboard } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };

/**
 * Dashboard landing page.
 *
 * The previous implementation called Prisma + Supabase directly from a Server Component
 * with three branches (MEMBER / UNIT_LEAD / ADMIN+) and ~25 DB queries. That was the file
 * that prompted the architecture review.
 *
 * It's been simplified to a placeholder while the corresponding NestJS modules
 * (Members, Attendance, Analytics, Sermons-member, Units) are rebuilt.
 *
 * Auth/role enforcement still happens in middleware.ts — only authenticated users with
 * MEMBER+ reach this page.
 *
 * Week 3+ plan:
 *   1. Build the missing NestJS modules
 *   2. Reintroduce role-specific dashboard views (MemberHome, UnitLeadHome, AdminOverview)
 *      each fetching from their own backend endpoint instead of running Prisma directly.
 */
export default function DashboardPage() {
  return (
    <ComingSoon
      title="Dashboard overview"
      description="Your personalized dashboard is being rebuilt against the new NestJS backend. Sermon management and the public sermon library are live — use the sidebar to navigate."
      icon={LayoutDashboard}
    />
  );
}
