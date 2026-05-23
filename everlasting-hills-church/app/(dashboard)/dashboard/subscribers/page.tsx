import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import { isAdmin } from "@/lib/auth/rbac";
import { getSubscribers } from "@/services/sermon.service";
import SubscriberList from "@/components/dashboard/admin/SubscriberList";

export const metadata = { title: "Sermon Subscribers — Dashboard" };

export default async function SubscribersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getMemberWithProfile(user.id);
  if (!profile || !isAdmin(profile.role)) redirect("/me");

  const subscribers = await getSubscribers();
  const serialised = subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    subscribedAt: s.subscribedAt.toISOString(),
  }));

  return <SubscriberList subscribers={serialised} />;
}
