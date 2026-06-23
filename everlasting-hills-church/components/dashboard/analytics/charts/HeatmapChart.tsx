"use client";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import { useAnalyticsHeatmap, type HeatmapPoint, type ServiceTypeFilter } from "@/lib/api/analytics";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK_ROWS = 5;
const LEGEND_SWATCHES = ["bg-[#87102C]/10","bg-[#87102C]/30","bg-[#87102C]/60","bg-[#87102C]"];

function cellColor(rate: number | null) {
  if (rate === null) return "bg-gray-100 dark:bg-white/5";
  if (rate >= 85)    return "bg-[#87102C]";
  if (rate >= 72)    return "bg-[#87102C]/60";
  if (rate >= 60)    return "bg-[#87102C]/30";
  return "bg-[#87102C]/10";
}

function buildGrid(points: HeatmapPoint[]): (number | null)[][] {
  const byMonth: (number | null)[][] = MONTHS.map(() => Array(WEEK_ROWS).fill(null));
  points.forEach((p) => {
    const dt   = new Date(p.date);
    const mi   = dt.getMonth();
    const week = Math.floor((dt.getDate() - 1) / 7);
    if (week < WEEK_ROWS) byMonth[mi][week] = p.rate;
  });
  return byMonth;
}

export function HeatmapChart({ serviceType }: { serviceType?: ServiceTypeFilter }) {
  const year = new Date().getFullYear();
  const { data, isLoading } = useAnalyticsHeatmap(year, serviceType);
  const grid = data ? buildGrid(data) : null;

  return (
    <ChartCard title="Attendance Heatmap — Full Year" minHeight="min-h-[130px]">
      {isLoading || !grid ? <ChartSkeleton /> : (
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            <div className="grid grid-cols-12 gap-1 mb-1">
              {MONTHS.map((m) => <div key={m} className="text-[9px] font-bold text-gray-400 text-center">{m}</div>)}
            </div>
            {Array.from({ length: WEEK_ROWS }, (_, wi) => (
              <div key={wi} className="grid grid-cols-12 gap-1 mb-1">
                {MONTHS.map((_, mi) => {
                  const rate = grid[mi][wi];
                  return (
                    <div key={mi} title={rate !== null ? `${rate}% attendance` : "No data"}
                      className={`h-4 rounded-sm ${cellColor(rate)} cursor-default transition-opacity hover:opacity-80`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[9px] text-gray-400">Less</span>
              {LEGEND_SWATCHES.map((cls) => <div key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />)}
              <span className="text-[9px] text-gray-400">More</span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
