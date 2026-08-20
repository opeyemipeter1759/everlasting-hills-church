import { loadMemberDashboard } from "./_loaders/member-loader";
import { safeGet, type MeResponse } from "./_loaders/shared";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Not awaited here — passed straight into loadMemberDashboard's Promise.all so
  // it fires alongside the other 6 dashboard requests instead of blocking them
  // behind a first round trip (none of those requests depend on its result,
  // they're all authenticated by the same request cookie).
  const mePromise = safeGet<MeResponse>("/auth/me").then(
    (me) => me ?? { profileId: null, role: null, tenantId: null, member: null }
  );

  return loadMemberDashboard(mePromise);
}
