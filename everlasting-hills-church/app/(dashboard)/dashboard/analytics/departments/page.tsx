import { Building2 } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Department analytics — Dashboard" };

export default function DepartmentAnalyticsPage() {
  return (
    <ComingSoon
      title="Department analytics"
      description="Per-unit attendance and engagement will be available once the Units + Analytics modules ship."
      icon={Building2}
    />
  );
}
