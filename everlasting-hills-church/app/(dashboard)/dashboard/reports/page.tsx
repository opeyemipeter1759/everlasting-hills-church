import { FileSpreadsheet } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Reports — Dashboard" };

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="CSV exports (pastor weekly, board monthly, members, giving, attendance, first-timers) return once the Reports module ships."
      icon={FileSpreadsheet}
    />
  );
}
