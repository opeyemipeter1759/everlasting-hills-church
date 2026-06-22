import type { MemberHomeProps } from "@/types";

export function MonthlyAttendanceChart({ data }: { data: MemberHomeProps["monthlyAttendance"] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 88;

  return (
    <div>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: CHART_H + 36 }}>
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxTotal) * CHART_H);
          const attendedH = d.total > 0 ? (d.attended / d.total) * totalH : 0;
          const pct = d.total > 0 ? Math.round((d.attended / d.total) * 100) : null;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 justify-end min-w-0"
              style={{ height: CHART_H + 36 }}
            >
              {pct !== null ? (
                <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">{pct}%</span>
              ) : (
                <span className="text-[9px] text-gray-300 dark:text-gray-700">—</span>
              )}
              <div
                className="w-full rounded-t relative overflow-hidden bg-gray-200 dark:bg-white/10"
                style={{ height: `${totalH}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700"
                  style={{ height: `${attendedH}px`, backgroundColor: "#87102C", opacity: 0.85 }}
                />
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center truncate w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#87102C] opacity-80" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-gray-200 dark:bg-white/10" />
          Total services
        </span>
      </div>
    </div>
  );
}
