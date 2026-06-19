import MemberHome from "@/components/dashboard/member/MemberHome";
export const metadata = { title: "Dashboard — Everlasting Hills Church" };
export const dynamic = "force-dynamic"; 

export default async function DashboardPage() {
   return <MemberHome />;
  }
