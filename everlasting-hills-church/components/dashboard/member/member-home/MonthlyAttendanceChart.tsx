import { TrendingUp } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { muted } from "./tokens";
import { PanelCard } from "./Primitives";

export function MonthlyAttendanceChart({ data }: { data: MemberHomeProps["monthlyAttendance"] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 88;

  return (
    <PanelCard kicker="Personal" title="Monthly Attendance" icon={TrendingUp}>
      <p className={`text-xs ${muted} mb-4`}>
        Services attended vs. held — last 6 months
      </p>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: CHART_H + 36 }}>
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxTotal) * CHART_H);
          const attendedH = d.total > 0 ? (d.attended / d.total) * totalH : 0;
          const pct = d.total > 0 ? Math.round((d.attended / d.total) * 100) : null;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end min-w-0" style={{ height: CHART_H + 36 }}>
              {pct !== null ? (
                <span className={`text-[9px] font-semibold ${muted} tabular-nums`}>{pct}%</span>
              ) : (
                <span className={`text-[9px] ${muted}`}>—</span>
              )}
              <div className="w-full rounded-t relative overflow-hidden bg-[#E7CDD3]/50 dark:bg-white/[0.07]" style={{ height: `${totalH}px` }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700"
                  style={{ height: `${attendedH}px`, backgroundColor: "#87102C", opacity: 0.85 }}
                />
              </div>
              <span className={`text-[9px] ${muted} text-center truncate w-full`}>{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-[#8a7e80] dark:text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#87102C] opacity-80" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#E7CDD3]/70 dark:bg-white/10" />
          Total services
        </span>
      </div>
    </PanelCard>
  );
}
