import SubscriberList from "@/components/dashboard/admin/SubscriberList";
import { serverApi } from "@/lib/api/server";

export const metadata = { title: "Sermon Subscribers — Dashboard" };

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

/**
 * Newsletter subscribers list. Middleware enforces PASTOR+.
 */
export default async function SubscribersPage() {
  const subscribers = await serverApi.get<Subscriber[]>("/sermons/subscribers", {
    cache: "no-store",
  });

  return <SubscriberList subscribers={subscribers} />;
}
