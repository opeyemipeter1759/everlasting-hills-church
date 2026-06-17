import { Network } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { MinistryUnit } from "@/lib/mock/admin-dashboard.mock";

function barColor(pct: number): string {
  if (pct >= 90) return "from-emerald-500 to-emerald-400";
  if (pct >= 80) return "from-[#87102C] to-[#c93860]";
  return "from-amber-500 to-amber-400";
}

/**
 * Full-width ministry units table. Uses a semantic <table> (readable on small screens
 * via horizontal scroll) with an inline attendance progress bar.
 */
export default function MinistryUnitsOverview({
  units,
  ...chrome
}: { units: MinistryUnit[] } & DashboardCardChrome) {
  return (
    <DashboardCard
      kicker="Departments"
      title="Ministry Units Overview"
      icon={Network}
      bodyClassName="p-0"
      {...chrome}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Ministry units with member counts and attendance rates
          </caption>
          <thead>
            <tr className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
              <th scope="col" className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C]/60 dark:text-white/35">
                Unit
              </th>
              <th scope="col" className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C]/60 dark:text-white/35">
                Members
              </th>
              <th scope="col" className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C]/60 dark:text-white/35">
                Attendance
              </th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr
                key={u.name}
                className="border-b border-[#E7CDD3]/30 last:border-0 hover:bg-[#FFF4F6]/50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
              >
                <th scope="row" className="px-5 py-3.5 text-left text-sm font-semibold text-[#111] dark:text-white">
                  {u.name}
                </th>
                <td className="px-5 py-3.5 text-right tabular-nums text-[#555] dark:text-white/60">
                  {u.members}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor(u.attendance)}`}
                        style={{ width: `${u.attendance}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold tabular-nums text-[#111] dark:text-white">
                      {u.attendance}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
