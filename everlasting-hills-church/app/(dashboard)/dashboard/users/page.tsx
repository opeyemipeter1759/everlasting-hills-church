import UsersCmsClient from "@/components/dashboard/admin/UsersCmsClient";

export const metadata = { title: "Manage Users — Dashboard" };

/**
 * Admin user management.
 *
 * Server Component shell — the actual CRUD UI lives in a Client Component because
 * the form + table need interactive state, role-filtered dropdowns, and optimistic
 * refresh after mutations.
 *
 * Middleware gates this to ADMIN+; the backend enforces per-action role hierarchy.
 */
export default function ManageUsersPage() {
  return <UsersCmsClient />;
}
