import { BarChart3 } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AttendancePoint } from "@/lib/mock/admin-dashboard.mock";

/**
 * Attendance trend as a clean vertical bar chart (template style): y-axis ticks,
 * gridlines, rounded brand bars with a hover value. Dependency-free CSS so bars never
 * distort. Accessible via role="img" + an off-screen value list.
 */
export default function AttendanceTrendCard({
  data,
  ...chrome
}: { data: AttendancePoint[] } & DashboardCardChrome) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const ceil = Math.max(Math.ceil(max / 100) * 100, 100);
  const ticks = [ceil, ceil * 0.75, ceil * 0.5, ceil * 0.25, 0];

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;

  return (
    <DashboardCard
      kicker="Growth"
      title="Attendance Trend"
      icon={BarChart3}
      action={
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          {delta >= 0 ? "+" : ""}
          {delta}% vs start
        </span>
      }
      {...chrome}
    >
      <div className="flex gap-3">
        {/* y-axis */}
        <div className="flex h-48 w-8 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-[#8a7e80] dark:text-white/40">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* plot + x-axis share the same flex column so labels align under bars */}
        <div className="min-w-0 flex-1">
          <div className="relative">
            {/* gridlines */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {ticks.map((_, i) => (
                <div key={i} className="h-px w-full bg-[#E7CDD3]/50 dark:bg-white/[0.07]" />
              ))}
            </div>

            <div
              className="relative flex h-48 items-end justify-between gap-2 sm:gap-3"
              role="img"
              aria-label={`Attendance over the last ${data.length} services, from ${first} to ${last} (${
                delta >= 0 ? "up" : "down"
              } ${Math.abs(delta)} percent).`}
            >
              {data.map((d) => (
                <div key={d.label} className="group flex h-full flex-1 items-end justify-center">
                  <div
                    className="relative w-full max-w-[34px] rounded-t-md bg-gradient-to-t from-[#87102C] to-[#c93860] transition-opacity hover:opacity-90 dark:from-[#87102C] dark:to-[#FFB3C1]"
                    style={{ height: `${(d.value / ceil) * 100}%` }}
                  >
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-[#111] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-[#111]">
                      {d.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* x-axis labels — same flex shape as the bars */}
          <div className="mt-2 flex justify-between gap-2 text-[10px] text-[#8a7e80] sm:gap-3 dark:text-white/40">
            {data.map((d) => (
              <span key={d.label} className="flex-1 text-center">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="sr-only">
        {data.map((d) => (
          <li key={d.label}>{`${d.label}: ${d.value} attendees`}</li>
        ))}
      </ul>
    </DashboardCard>
  );
}
