import { CalendarDays } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Services — Dashboard" };

export default function ServicesPage() {
  return (
    <ComingSoon
      title="Services"
      description="Service scheduling, attendance check-ins, and QR codes return once the Services module ships."
      icon={CalendarDays}
    />
  );
}
