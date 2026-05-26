import { Bell } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Pastoral alerts — Dashboard" };

export default function AlertsPage() {
  return (
    <ComingSoon
      title="Pastoral alerts"
      description="Absence, birthday, anniversary, and at-risk alerts return once the Pastoral Alerts module ships."
      icon={Bell}
    />
  );
}
