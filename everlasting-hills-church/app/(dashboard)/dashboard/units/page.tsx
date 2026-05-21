import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Network } from "lucide-react";

export default function UnitsPage() {
  return (
    <ComingSoon
      title="Units"
      description="Manage church departments and ministries. Assign unit leads and track member rosters."
      icon={Network}
    />
  );
}
