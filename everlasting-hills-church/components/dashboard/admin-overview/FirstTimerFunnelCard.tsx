import { Filter } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { FunnelStage } from "@/lib/mock/admin-dashboard.mock";

/**
 * First-timer funnel — proportional bars from registration to joining a class.
 */
export default function FirstTimerFunnelCard({
  stages,
  ...chrome
}: { stages: FunnelStage[] } & DashboardCardChrome) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <DashboardCard kicker="Newcomers" title="First Timer Funnel" icon={Filter} {...chrome}>
      <ul className="space-y-3">
        {stages.map((stage, i) => {
          const pct = Math.round((stage.value / max) * 100);
          return (
            <li key={stage.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-[#444] dark:text-white/70">{stage.label}</span>
                <span className="font-bold tabular-nums text-[#111] dark:text-white">{stage.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#87102C] to-[#c93860]"
                  style={{ width: `${pct}%`, opacity: 1 - i * 0.12 }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
