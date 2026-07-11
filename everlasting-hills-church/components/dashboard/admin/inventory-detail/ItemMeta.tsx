import { Banknote, Calendar, Hash, MapPin, Tag, User } from "lucide-react";
import type { ReactNode } from "react";
import type { InventoryItemDetail } from "../inventory/types";
import { formatDate, formatNaira } from "../inventory/helpers";

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-300 dark:text-white/20 mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function ItemMeta({ item }: { item: InventoryItemDetail }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
        Item details
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Row icon={<Hash size={14} />} label="Serial / asset tag" value={item.serialNumber ?? "—"} />
        <Row icon={<MapPin size={14} />} label="Location" value={item.location ?? "—"} />
        <Row icon={<Tag size={14} />} label="Quantity" value={String(item.quantity)} />
        <Row icon={<User size={14} />} label="Assigned to" value={item.assignedTo ?? "Unassigned"} />
        <Row icon={<Calendar size={14} />} label="Purchase date" value={formatDate(item.purchaseDate)} />
        <Row icon={<Banknote size={14} />} label="Purchase value" value={formatNaira(item.purchaseValue)} />
      </div>
      {item.notes && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}
    </div>
  );
}
