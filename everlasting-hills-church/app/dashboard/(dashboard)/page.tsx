import { loadMemberDashboard } from "./_loaders/member-loader";
import { safeGet, type MeResponse } from "./_loaders/shared";

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

  return loadMemberDashboard(me);
}
