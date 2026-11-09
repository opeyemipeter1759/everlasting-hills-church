import type { ReactNode } from "react";

export type StatTone = "neutral" | "amber" | "emerald" | "brand";

const STAT_TILE_CLS: Record<StatTone, string> = {
  neutral: "bg-white dark:bg-[#161618] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white",
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  brand: "bg-[#87102C] text-white",
};

/** One small stat tile in the bento block: "Enrolled 4", "Avg. progress 62%". */
export function BentoStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string | number; tone: StatTone }) {
  const iconWrap = tone === "neutral" ? "bg-[#87102C]/10 dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a]" : "bg-white/20 text-white";
  const labelCls = tone === "neutral" ? "text-gray-400 dark:text-gray-500" : "text-white/75";

  return (
    <div className={`flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 ${STAT_TILE_CLS[tone]}`}>
      <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${iconWrap}`}>{icon}</span>
      <div className="mt-2 sm:mt-3">
        <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${labelCls}`}>{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}
