import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { BookOpen } from "lucide-react";

export default function SermonsPage() {
  return (
    <ComingSoon
      title="Sermons"
      description="Manage sermon archives. Add audio, video links, notes, and scripture references."
      icon={BookOpen}
    />
  );
}
