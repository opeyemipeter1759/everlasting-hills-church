import { Suspense } from "react";
import PrayerWatchAdminTabs from "@/components/dashboard/admin/prayer-watch/overview/PrayerWatchAdminTabs";

export const metadata = { title: "Prayer Watch — Dashboard" };

export default function AdminPrayerWatchPage() {
  return (
    <Suspense>
      <PrayerWatchAdminTabs />
    </Suspense>
  );
}
