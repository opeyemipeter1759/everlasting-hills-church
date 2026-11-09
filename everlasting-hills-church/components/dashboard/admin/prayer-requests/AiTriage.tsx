import { AlertTriangle, Sparkles } from "lucide-react";
import type { PrayerRequestRow } from "@/lib/api/prayer-requests";
import { URGENCY_STYLE } from "./shared";

/** The AI's read of a request: urgency, category, who it should go to, and a summary. */
export default function AiTriage({ r }: { r: PrayerRequestRow }) {
  if (!(r.aiCategory || r.aiUrgency || r.aiRouteTo)) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#FFF4F6]/50 dark:bg-white/[0.03] px-3 py-2">
      <Sparkles size={11} className="shrink-0 text-[#87102C]/50 dark:text-[#e8768a]/50" aria-hidden="true" />
      {r.aiUrgency && (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${URGENCY_STYLE[r.aiUrgency]?.className ?? URGENCY_STYLE.routine.className}`}>
          {r.aiUrgency === "urgent" && <AlertTriangle size={9} />}
          {URGENCY_STYLE[r.aiUrgency]?.label ?? r.aiUrgency}
        </span>
      )}
      {r.aiCategory && (
        <span className="rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-white/60">
          {r.aiCategory}
        </span>
      )}
      {r.aiRouteTo && <span className="text-[11px] text-gray-500 dark:text-white/50">→ {r.aiRouteTo}</span>}
      {r.aiSummary && <p className="w-full text-[11px] italic text-gray-500 dark:text-white/45 mt-0.5">{r.aiSummary}</p>}
    </div>
  );
}
