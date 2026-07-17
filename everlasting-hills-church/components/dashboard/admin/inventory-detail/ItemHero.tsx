import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import type { InventoryItemDetail } from "../inventory/types";
import { ConditionBadge, StatusBadge } from "../inventory/badges";

export default function ItemHero({ item }: { item: InventoryItemDetail }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] overflow-hidden">
      <div className="relative h-40 sm:h-48 bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Package size={40} className="text-[#87102C]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <Link
          href="/dashboard/admin/inventory"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-black/50 transition-colors"
        >
          <ArrowLeft size={13} /> All items
        </Link>

        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <StatusBadge status={item.status} />
            <ConditionBadge condition={item.condition} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{item.name}</h1>
          <p className="text-sm text-white/80">{item.category}</p>
        </div>
      </div>
    </div>
  );
}
