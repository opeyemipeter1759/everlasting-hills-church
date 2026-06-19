import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { UserPlus } from "lucide-react";

export default function FirstTimersPage() {
  return (
    <ComingSoon
      title="First Timers"
      description="Pipeline view of first-timer form submissions. Review, create accounts, and track follow-ups."
      icon={UserPlus}
    />
  );
}
