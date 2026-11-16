import type { InspectionResult } from "@/lib/api/service-readiness-plans";

/** An inspection result as a pill; `label` prefixes it, e.g. "Day before". Nothing recorded shows a dash. */
export function ResultChip({ result, label }: { result: InspectionResult | null; label?: string }) {
  const cls =
    result === "READY"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : result === "ISSUES"
        ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50";
  const text = result === "READY" ? "Ready" : result === "ISSUES" ? "Issues" : "—";
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {label ? `${label}: ${text}` : text}
    </span>
  );
}
