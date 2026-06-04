import { Wallet } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import { TrendPill } from "./DashboardStatCard";
import type { AdminDashboardData } from "@/lib/mock/admin-dashboard.mock";

/**
 * Giving (This Month) — executive financial metric that replaces the health score.
 * Shows the month's total with a trend and a source breakdown.
 */
export default function GivingSummaryCard({
  giving,
  ...chrome
}: { giving: AdminDashboardData["giving"] } & DashboardCardChrome) {
  const total = giving.breakdown.reduce((sum, b) => sum + b.value, 0) || 1;
  const fmt = (n: number) => `${giving.currency}${n.toLocaleString()}`;

  return (
    <DashboardCard kicker="Executive Summary" title="Giving (This Month)" icon={Wallet} {...chrome}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-3xl font-bold tabular-nums text-[#111] dark:text-white">
          {fmt(giving.thisMonth)}
        </span>
        <TrendPill trend={giving.trend} />
      </div>
      <p className="mt-1.5 text-sm text-[#8a7e80] dark:text-white/50">
        Tithes, offerings and online giving received so far this month.
      </p>

      <ul className="mt-5 space-y-3">
        {giving.breakdown.map((b) => {
          const pct = Math.round((b.value / total) * 100);
          return (
            <li key={b.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-[#444] dark:text-white/70">{b.label}</span>
                <span className="font-bold tabular-nums text-[#111] dark:text-white">{fmt(b.value)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#87102C] to-[#c93860]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
