import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Inbox } from "lucide-react";

export default function SubmissionsPage() {
  return (
    <ComingSoon
      title="Submissions"
      description="All connect page form responses in one place. Filter by type, respond, and track status."
      icon={Inbox}
    />
  );
}
