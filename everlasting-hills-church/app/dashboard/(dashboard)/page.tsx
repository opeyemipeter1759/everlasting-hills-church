import { loadAdminDashboard } from "./_loaders/admin-loader";
import { loadMemberDashboard } from "./_loaders/member-loader";
import { loadUnitLeadDashboard } from "./_loaders/unit-lead-loader";
import { normalizeRole, safeGet, type MeResponse } from "./_loaders/shared";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me =
    (await safeGet<MeResponse>("/auth/me")) ?? {
      profileId: null,
      role: null,
      tenantId: null,
      member: null,
    };
  const role = normalizeRole(me.role);

/*   if (role === "ADMIN" || role === "PASTOR" || role === "SUPER_ADMIN") {
    return loadAdminDashboard(me);
  }
  if (role === "UNIT_LEAD") {
    return loadUnitLeadDashboard(me);
  } */
  return loadMemberDashboard(me);
}
