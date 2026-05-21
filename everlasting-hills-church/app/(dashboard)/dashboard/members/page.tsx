import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Users } from "lucide-react";

export default function MembersPage() {
  return (
    <ComingSoon
      title="Members"
      description="View, search, and manage all church members. Create accounts, assign roles, and track engagement."
      icon={Users}
    />
  );
}
