import { AlertTriangle, Wallet, Wrench } from "lucide-react";
import type { InventoryItemDetail } from "../inventory/types";
import { formatNaira } from "../inventory/helpers";

export default function SpendSummary({ item }: { item: InventoryItemDetail }) {
  const repairCost = item.history.filter((h) => h.type === "REPAIR").reduce((sum, h) => sum + (h.cost ?? 0), 0);
  const purchaseValue = item.purchaseValue ?? 0;
  const expensiveToRepair = purchaseValue > 0 && repairCost > purchaseValue;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
        Total cost of ownership
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a] mb-2">
            <Wallet size={14} />
          </span>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Purchase</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{formatNaira(purchaseValue)}</p>
        </div>
        <div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-2">
            <Wrench size={14} />
          </span>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Repairs</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{formatNaira(repairCost)}</p>
        </div>
        <div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 mb-2">
            <Wallet size={14} />
          </span>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Total spent</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{formatNaira(item.totalSpent)}</p>
        </div>
      </div>
      {expensiveToRepair && (
        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
          <AlertTriangle size={13} /> Repairs have cost more than the original purchase — consider replacing.
        </p>
      )}
    </div>
  );
}
