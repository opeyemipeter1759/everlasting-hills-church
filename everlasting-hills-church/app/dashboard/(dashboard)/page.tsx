import { MemberDashboard } from "./_loaders/member-loader";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <MemberDashboard />;
}
