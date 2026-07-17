import { loadMemberDashboard } from "./_loaders/member-loader";
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

  return loadMemberDashboard(me);
}
