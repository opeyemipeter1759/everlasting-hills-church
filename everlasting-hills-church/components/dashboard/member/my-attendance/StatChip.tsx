const STAT_TONES = {
  rose: "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]",
  emerald: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  sky: "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
} as const;

/** A single summary figure with its icon: "Present 12". */
export function StatChip({ icon: Icon, label, value, tone }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone: keyof typeof STAT_TONES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] px-4 py-3.5">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-[#111] dark:text-white tabular-nums">{value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#8a7e80] dark:text-white/40 truncate">{label}</p>
      </div>
    </div>
  );
}
