import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { ClipboardList } from "lucide-react";

export default function AttendancePage() {
  return (
    <ComingSoon
      title="Attendance"
      description="View attendance by service, track trends, manage absentees, and export reports."
      icon={ClipboardList}
    />
  );
}
