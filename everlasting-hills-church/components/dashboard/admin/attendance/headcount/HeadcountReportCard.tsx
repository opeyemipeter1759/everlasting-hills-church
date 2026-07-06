"use client";

import { AlertTriangle, Check, Pencil, Users } from "lucide-react";
import type { Headcount, ServiceTypeKey } from "@/lib/api/headcount";
import { TYPE_LABEL, prettyDate } from "./date-utils";

/**
 * Card-format display of one service's usher headcount. `featured` renders the
 * large detailed card (report page hero); the default is a compact grid card.
 */
export default function HeadcountReportCard({
  hc,
  serviceName,
  serviceType,
  serviceDate,
  featured = false,
  onClick,
}: {
  hc: Headcount | null;
  serviceName: string | null;
  serviceType: ServiceTypeKey;
  serviceDate: string; // YYYY-MM-DD
  featured?: boolean;
  onClick?: () => void;
}) {
  const Wrapper: React.ElementType = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`w-full text-left rounded-2xl border bg-white dark:bg-[#1c1c1e] p-4 transition-colors ${
        onClick ? "hover:border-[#87102C]/30 hover:bg-[#FFF4F6]/40 dark:hover:bg-white/[0.04]" : ""
      } border-gray-200 dark:border-white/10`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
            {TYPE_LABEL[serviceType]} service
          </p>
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{serviceName ?? prettyDate(serviceDate)}</p>
          <p className="text-[11px] text-gray-400 dark:text-white/40">{prettyDate(serviceDate)}</p>
        </div>
        {hc ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
            hc.status === "CONFIRMED"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            {hc.status === "CONFIRMED" ? <><Check size={11} /> Confirmed</> : "Draft"}
            {hc.edited && <Pencil size={10} className="opacity-70" />}
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
            Not counted
          </span>
        )}
      </div>

      {hc ? (
        <>
          <div className={`mt-3 flex items-end justify-between ${featured ? "" : "gap-3"}`}>
            <div className={`grid ${featured ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"} gap-2 flex-1 ${featured ? "mr-4" : ""}`}>
              <Metric label="Men" value={hc.men} />
              <Metric label="Women" value={hc.women} />
              <Metric label="Children" value={hc.children} />
              <Metric label="First-timers" value={hc.firstTimers} accent />
            </div>
            <div className="text-right shrink-0">
              <p className={`font-black tabular-nums leading-none text-[#87102C] dark:text-white ${featured ? "text-5xl" : "text-3xl"}`}>{hc.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">total present</p>
            </div>
          </div>
          {hc.variance && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle size={12} /> Usher reported {hc.variance.reportedTotal}, computed total {hc.variance.computedTotal} (used for analytics).
            </p>
          )}
          {featured && hc.notes && <p className="mt-2 text-[11px] italic text-gray-400 dark:text-white/40">&ldquo;{hc.notes}&rdquo;</p>}
        </>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-white/40">
          <Users size={14} /> No headcount recorded for this date.
        </div>
      )}
    </Wrapper>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${accent ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-gray-50 dark:bg-white/[0.03]"}`}>
      <p className={`text-lg font-black tabular-nums leading-none ${accent ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>{value}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">{label}</p>
    </div>
  );
}
