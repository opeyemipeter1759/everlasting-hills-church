import { UserPlus } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "First-timer analytics — Dashboard" };

export default function FirstTimerAnalyticsPage() {
  return (
    <ComingSoon
      title="First-timer analytics"
      description="Conversion funnel, sources, and monthly trends return once the Visitors + Analytics modules ship."
      icon={UserPlus}
    />
  );
}
