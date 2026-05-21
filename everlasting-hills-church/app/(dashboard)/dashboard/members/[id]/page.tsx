import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { User } from "lucide-react";

export default function MemberDetailPage() {
  return (
    <ComingSoon
      title="Member Profile"
      description="Full attendance history, unit membership, giving records, and pastoral notes."
      icon={User}
    />
  );
}
