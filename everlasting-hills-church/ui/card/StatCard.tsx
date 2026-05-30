'use client';

import type { StatCardProps } from '@/types';

export default function StatCard({
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
    <div className="group relative">
      {/* outer glow halo — expands on hover */}
      <div
        className={`absolute -inset-0.5 rounded-[22px] bg-gradient-to-br ${glowFrom} ${glowTo}
          opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300`}
      />

      <div
        className="relative overflow-hidden rounded-[20px]
          border border-gray-100 dark:border-white/[0.07]
          bg-white dark:bg-[#111111] p-5
          group-hover:border-transparent
          group-hover:shadow-2xl group-hover:shadow-gray-100/80 dark:group-hover:shadow-black/60
          group-hover:-translate-y-2
          transition-all duration-250 cursor-default"
      >
        {/* bottom accent bar — dim at rest, vivid on hover */}
        <div
          className={`absolute inset-x-0 bottom-0 h-[2.5px] bg-gradient-to-r ${accentBar}
            opacity-20 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* large faint watermark circle behind icon */}
        <div
          className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full ${iconBg} opacity-25 transition-opacity duration-300 group-hover:opacity-40`}
        />

        {/* circular icon */}
        <div
          className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full
            ${iconBg} ${iconColor}
            shadow-sm group-hover:scale-110 group-hover:shadow-lg
            transition-all duration-200`}
        >
          {icon}
        </div>

        {/* number */}
        {loading ? (
          <div className="mb-2 h-10 w-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />
        ) : (
          <p className="font-display mb-1 text-[2.6rem] font-bold leading-none tracking-tight tabular-nums text-gray-900 dark:text-white">
            {value ?? 0}
          </p>
        )}

        {/* label */}
        {loading ? (
          <div className="mb-1 h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        ) : (
          <p className="font-sans text-[11.5px] font-extrabold tracking-wide text-gray-700 dark:text-gray-200 mt-1.5">
            {label}
          </p>
        )}

        {/* description */}
        {loading ? (
          <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-50 dark:bg-white/5" />
        ) : (
          <p className="font-sans mt-0.5 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
