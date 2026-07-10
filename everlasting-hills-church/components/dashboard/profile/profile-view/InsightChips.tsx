import type { LucideIcon } from "lucide-react";

/** Insight Chip — compact Anchor Info Chip for the metrics strip. */
export function InsightChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-4 sm:p-5
      hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_4px_24px_rgba(135,16,44,0.07)] dark:hover:shadow-none hover:-translate-y-0.5
      transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.18em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
          {label}
        </p>
        <p className="text-sm font-bold text-[#111] dark:text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

/** Insight chip variant for the dark gradient insights section (glassmorphic card). */
export function DarkInsightChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3.5
        bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl p-4 sm:p-5
        hover:bg-white/[0.12] hover:border-white/[0.22]
        transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.18em] uppercase font-semibold text-white/40">
          {label}
        </p>
        <p className="text-sm font-bold text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
