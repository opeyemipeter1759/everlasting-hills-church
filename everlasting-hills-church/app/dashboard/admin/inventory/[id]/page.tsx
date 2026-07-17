import InventoryDetailClient from "@/components/dashboard/admin/InventoryDetailClient";

export const metadata = { title: "Inventory Item — Dashboard" };

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
  return <InventoryDetailClient id={params.id} />;
}
