import type { StatCardProps } from '@/types';

export function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  glowFrom,
  glowTo,
  accentBar,
  description,
  loading,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4 transition-colors">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${glowFrom} ${glowTo} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`}
      />
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accentBar}`} />

      <div className="relative flex items-start justify-between mb-2">
        <span className="font-sans text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </span>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>

      {loading ? (
        <>
          <div className="h-7 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700/60" />
          <div className="mt-1.5 h-2.5 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-700/40" />
        </>
      ) : (
        <>
          <p className="relative font-sans text-3xl font-black leading-none text-gray-900 dark:text-white">
            {value ?? 0}
          </p>
          <p className="relative mt-1.5 font-sans text-[11px] text-gray-400 dark:text-gray-500">
            {description}
          </p>
        </>
      )}
    </div>
  );
}
