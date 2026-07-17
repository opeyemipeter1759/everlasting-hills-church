"use client";

import { MapPin, Package } from "lucide-react";
import type { InventoryItem } from "./types";
import { ConditionBadge, StatusBadge } from "./badges";

export default function InventoryCard({ item, onOpen }: { item: InventoryItem; onOpen: (item: InventoryItem) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
      className="group bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-[#87102C]/30 hover:shadow-md transition-all flex flex-col"
    >
      <div className="h-32 bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center overflow-hidden">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photoUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package size={28} className="text-[#87102C]" />
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={item.status} />
          <ConditionBadge condition={item.condition} />
        </div>

        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>

        <div className="flex items-center justify-between mt-auto pt-2 text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin size={12} className="flex-shrink-0" />
            {item.location ?? "No location"}
          </span>
          {item.quantity > 1 && <span className="font-semibold text-gray-500 dark:text-gray-400">×{item.quantity}</span>}
        </div>
      </div>
    </div>
  );
}
