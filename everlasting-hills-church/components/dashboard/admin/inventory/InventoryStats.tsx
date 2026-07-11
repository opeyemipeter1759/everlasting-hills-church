import type { ReactNode } from "react";
import { Archive, Package, Wallet, Wrench } from "lucide-react";
import type { InventoryStatsData } from "./types";
import { formatNaira } from "./helpers";

function StatCard({
  icon,
  label,
  value,
  tone = "burgundy",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: "burgundy" | "amber" | "gray";
}) {
  const toneCls =
    tone === "amber"
      ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : tone === "gray"
        ? "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
        : "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a]";
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${toneCls}`}>{icon}</span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

export default function InventoryStats({ stats }: { stats?: InventoryStatsData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={<Package size={16} />} label="Total Items" value={stats?.total ?? 0} />
      <StatCard icon={<Wrench size={16} />} label="Under Repair" value={stats?.underRepair ?? 0} tone="amber" />
      <StatCard icon={<Archive size={16} />} label="Retired" value={stats?.retired ?? 0} tone="gray" />
      <StatCard icon={<Wallet size={16} />} label="Total Value" value={formatNaira(stats?.totalValue ?? 0)} />
    </div>
  );
}
