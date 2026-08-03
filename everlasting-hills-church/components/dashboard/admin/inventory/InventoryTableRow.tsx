"use client";

import { MapPin, Package } from "lucide-react";
import type { InventoryItem } from "./types";
import { ConditionBadge, StatusBadge } from "./badges";
import { TD } from "./tableStyles";

export default function InventoryTableRow({
  item,
  onOpen,
}: {
  item: InventoryItem;
  onOpen: (item: InventoryItem) => void;
}) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
      className="group cursor-pointer border-b border-gray-100 dark:border-white/[0.06] last:border-0 hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] transition-colors"
    >
      <td className={TD}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
            {item.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package size={16} className="text-[#87102C]" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</p>
          </div>
        </div>
      </td>
      <td className={TD}>
        <StatusBadge status={item.status} />
      </td>
      <td className={TD}>
        <ConditionBadge condition={item.condition} />
      </td>
      <td className={TD}>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
          <MapPin size={12} className="flex-shrink-0" />
          {item.location ?? "No location"}
        </span>
      </td>
      <td className={`${TD} text-right text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap`}>
        {item.quantity}
      </td>
    </tr>
  );
}
