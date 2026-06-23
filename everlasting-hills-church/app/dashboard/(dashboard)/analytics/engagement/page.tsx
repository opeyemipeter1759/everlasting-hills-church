import { Activity } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Engagement analytics — Dashboard" };

export default function EngagementAnalyticsPage() {
  return (
    <ComingSoon
      title="Engagement analytics"
      description="Engagement scoring, at-risk members, and the leaderboard return once the Engagement module ships."
      icon={Activity}
    />
  );
}
