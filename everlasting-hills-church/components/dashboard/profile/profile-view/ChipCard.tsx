import type { LucideIcon } from "lucide-react";

/**
 * Anchor Info Chip Card — Elevated Card pattern from design system.
 * Icon in branded square + label above value below.
 */
export function ChipCard({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-1
        transition-all duration-300 flex flex-col gap-4 h-full ${className}`}
    >
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-1.5">
          {label}
        </p>
        <div className="text-[15px] font-semibold text-[#111] dark:text-white leading-snug break-words">
          {value}
        </div>
      </div>
    </div>
  );
}
