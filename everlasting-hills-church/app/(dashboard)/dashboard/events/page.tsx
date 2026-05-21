import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { CalendarDays } from "lucide-react";

export default function EventsPage() {
  return (
    <ComingSoon
      title="Events"
      description="Create and manage church events. Track registrations, capacity, and attendance."
      icon={CalendarDays}
    />
  );
}
