import AdminDashboardClient from "@/components/dashboard/admin-overview/AdminDashboardClient";

export const metadata = { title: "Super Admin Dashboard — Everlasting Hills Church" };

/**
 * Super Admin dashboard overview. Server shell; the interactive, state-managed view
 * lives in the client component. Middleware gates /admin/* to SUPER_ADMIN.
 */
export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
