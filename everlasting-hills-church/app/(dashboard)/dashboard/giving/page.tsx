import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { DollarSign } from "lucide-react";

export default function GivingPage() {
  return (
    <ComingSoon
      title="Giving"
      description="Track tithes, offerings, and donations. View trends, export reports, and monitor campaigns."
      icon={DollarSign}
    />
  );
}
