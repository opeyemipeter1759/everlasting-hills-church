import type { InventoryItem } from "./types";
import InventoryTableRow from "./InventoryTableRow";
import { TH } from "./tableStyles";

export default function InventoryTable({
  items,
  onOpen,
}: {
  items: InventoryItem[];
  onOpen: (item: InventoryItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={TH}>Item</th>
            <th className={TH}>Status</th>
            <th className={TH}>Condition</th>
            <th className={TH}>Location</th>
            <th className={`${TH} text-right`}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <InventoryTableRow key={item.id} item={item} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
