import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon?: LucideIcon;
  iconColor?: string;
};

export default function StatCard({ label, value, sub, trend, icon: Icon, iconColor = "text-blue-400" }: Props) {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-medium ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
              {trend >= 0 ? "+" : ""}{trend}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gray-100 dark:bg-white/5 ${iconColor}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
