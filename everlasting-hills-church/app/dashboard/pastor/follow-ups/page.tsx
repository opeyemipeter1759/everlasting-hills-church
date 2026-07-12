import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { PhoneForwarded } from "lucide-react";

export default function FollowUpsPage() {
  return (
    <ComingSoon
      title="Follow-ups"
      description="Track pastoral follow-ups for first-timers, absentees, and members who need care."
      icon={PhoneForwarded}
    />
  );
}
