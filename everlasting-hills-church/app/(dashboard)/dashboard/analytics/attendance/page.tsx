import { CalendarCheck } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Attendance analytics — Dashboard" };

export default function AttendanceAnalyticsPage() {
  return (
    <ComingSoon
      title="Attendance analytics"
      description="Weekly trends, day-of-week averages, and top attendees return once the Attendance + Analytics modules ship."
      icon={CalendarCheck}
    />
  );
}
