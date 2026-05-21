import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Heart } from "lucide-react";

export default function PrayerRequestsPage() {
  return (
    <ComingSoon
      title="Prayer Requests"
      description="View and respond to prayer requests. Assign to pastoral team and track follow-ups."
      icon={Heart}
    />
  );
}
