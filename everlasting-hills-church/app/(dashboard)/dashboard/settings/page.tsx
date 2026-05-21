import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Configure church profile, service defaults, notification preferences, and integrations."
      icon={Settings}
    />
  );
}
