import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytics"
      description="Growth trends, retention rates, engagement scores, and giving analytics."
      icon={BarChart3}
    />
  );
}
