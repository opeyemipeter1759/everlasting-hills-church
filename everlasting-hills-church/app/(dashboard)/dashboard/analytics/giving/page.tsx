import { Gift } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Giving analytics — Dashboard" };

export default function GivingAnalyticsPage() {
  return (
    <ComingSoon
      title="Giving analytics"
      description="Giving trends, category breakdowns, and top donors return once the Giving module ships."
      icon={Gift}
    />
  );
}
