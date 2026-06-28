import { User } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Member — Dashboard" };

export default function MemberDetailPage() {
  return (
    <ComingSoon
      title="Member profile"
      description="Member detail will return once the Members module ships."
      icon={User}
    />
  );
}
