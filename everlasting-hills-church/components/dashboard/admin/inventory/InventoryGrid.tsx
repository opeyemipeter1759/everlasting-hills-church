import type { InventoryItem } from "./types";
import InventoryCard from "./InventoryCard";

export default function InventoryGrid({
  items,
  onOpen,
}: {
  items: InventoryItem[];
  onOpen: (item: InventoryItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <InventoryCard key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
