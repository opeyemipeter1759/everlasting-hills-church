import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Calendar } from "lucide-react";

export default function ServicesPage() {
  return (
    <ComingSoon
      title="Services"
      description="Create and manage church services. Open check-in, track attendance counts, and view service history."
      icon={Calendar}
    />
  );
}
