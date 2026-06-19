import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  return (
    <ComingSoon
      title="Announcements"
      description="Create and schedule announcements. Target specific units, roles, or all members."
      icon={Megaphone}
    />
  );
}
