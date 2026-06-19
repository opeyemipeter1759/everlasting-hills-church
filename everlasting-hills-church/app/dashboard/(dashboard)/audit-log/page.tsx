import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Shield } from "lucide-react";

export default function AuditLogPage() {
  return (
    <ComingSoon
      title="Audit Log"
      description="Append-only log of all admin actions. Search by actor, action type, and date range."
      icon={Shield}
    />
  );
}
