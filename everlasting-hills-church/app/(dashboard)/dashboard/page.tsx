import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { countTodayCheckIns } from "@/services/attendance.service";
import AdminOverview from "@/components/dashboard/AdminOverview";
import { db } from "@/lib/db/prisma";
import type { VisitorRow, MemberRow, AdminStats } from "@/components/dashboard/AdminOverview";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

async function fetchDashboardData() {
  const supabase = createAdminClient();

  const [
    { count: visitorsCount },
    { count: prayersCount },
    { count: membersCount },
    { data: visitors },
    { data: members },
  ] = await Promise.all([
    supabase.from("Visitor").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    supabase.from("PrayerRequest").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    supabase.from("Member").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    supabase
      .from("Visitor")
      .select("id, firstName, lastName, email, phone, gender, attendanceType, membershipInterest, howDidYouLearn, locatedInIbadan, bornAgain, occupation, submittedAt")
      .eq("tenantId", TENANT_ID)
      .order("submittedAt", { ascending: false })
      .limit(10),
    supabase
      .from("Member")
      .select("id, firstName, lastName, email, phone, joinedAt")
      .eq("tenantId", TENANT_ID)
      .order("joinedAt", { ascending: false })
      .limit(10),
  ]);

  const todayCheckIns = await countTodayCheckIns();

  const stats: AdminStats = {
    members: membersCount ?? 0,
    visitors: visitorsCount ?? 0,
    todayCheckIns,
    prayers: prayersCount ?? 0,
  };

  const memberEmails: string[] = (members ?? [])
    .map((m: any) => m.email as string | null)
    .filter((e): e is string => typeof e === "string" && e.length > 0);

  return {
    stats,
    recentVisitors: (visitors ?? []) as VisitorRow[],
    recentMembers: (members ?? []) as MemberRow[],
    memberEmails,
  };
}

export default async function DashboardPage() {
  const [user, data] = await Promise.all([getCurrentUser(), fetchDashboardData()]);

  // Get the member's first name for the greeting
  let firstName: string | null = null;
  if (user) {
    const profile = await db.profile.findUnique({
      where: { userId: user.id },
      include: { member: true },
    });
    firstName = profile?.member?.firstName ?? null;
  }

  return (
    <AdminOverview
      userName={firstName}
      stats={data.stats}
      recentVisitors={data.recentVisitors}
      recentMembers={data.recentMembers}
      memberEmails={data.memberEmails}
    />
  );
}
