import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { Package } from "lucide-react";

export default function InventoryPage() {
  return (
    <ComingSoon
      title="Inventory"
      description="Track church equipment, supplies, and assets. Manage check-outs and low-stock alerts."
      icon={Package}
    />
  );
}
