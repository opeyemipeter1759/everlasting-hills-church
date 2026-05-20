import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type {
  VisitorRow,
  PrayerRow,
  ContactRow,
  TestimonyRow,
  DashboardStats,
} from "@/components/dashboard/DashboardClient";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

async function fetchAll() {
  const db = createAdminClient();

  const [
    { count: visitorsCount },
    { count: prayersCount },
    { count: contactsCount },
    { count: testimoniesCount },
    { data: visitors },
    { data: prayers },
    { data: contacts },
    { data: testimonies },
  ] = await Promise.all([
    db.from("Visitor").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    db.from("PrayerRequest").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    db.from("ContactMessage").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    db.from("FormSubmission").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID).eq("type", "testimony"),
    db.from("Visitor")
      .select("id, firstName, lastName, email, phone, gender, submittedAt")
      .eq("tenantId", TENANT_ID)
      .order("submittedAt", { ascending: false })
      .limit(50),
    db.from("PrayerRequest")
      .select("id, name, email, phone, request, isAnonymous, submittedAt")
      .eq("tenantId", TENANT_ID)
      .order("submittedAt", { ascending: false })
      .limit(50),
    db.from("ContactMessage")
      .select("id, name, email, message, sentAt")
      .eq("tenantId", TENANT_ID)
      .order("sentAt", { ascending: false })
      .limit(50),
    db.from("FormSubmission")
      .select("id, data, submittedAt")
      .eq("tenantId", TENANT_ID)
      .eq("type", "testimony")
      .order("submittedAt", { ascending: false })
      .limit(50),
  ]);

  const stats: DashboardStats = {
    visitors: visitorsCount ?? 0,
    prayers: prayersCount ?? 0,
    contacts: contactsCount ?? 0,
    testimonies: testimoniesCount ?? 0,
  };

  return {
    stats,
    visitors: (visitors ?? []) as VisitorRow[],
    prayers: (prayers ?? []) as PrayerRow[],
    contacts: (contacts ?? []) as ContactRow[],
    testimonies: (testimonies ?? []) as TestimonyRow[],
  };
}

export default async function DashboardPage() {
  const [user, data] = await Promise.all([getCurrentUser(), fetchAll()]);

  return (
    <DashboardClient
      userEmail={user?.email}
      stats={data.stats}
      visitors={data.visitors}
      prayers={data.prayers}
      contacts={data.contacts}
      testimonies={data.testimonies}
    />
  );
}
