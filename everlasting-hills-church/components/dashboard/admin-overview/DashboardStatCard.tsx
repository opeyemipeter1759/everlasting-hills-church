import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { Trend } from "@/lib/mock/admin-dashboard.mock";

export function TrendPill({ trend }: { trend: Trend }) {
  const up = trend.direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
      }`}
    >
      {up ? <ArrowUpRight size={11} aria-hidden="true" /> : <ArrowDownRight size={11} aria-hidden="true" />}
      {trend.value}%
      <span className="sr-only">{up ? "increase" : "decrease"} from last period</span>
    </span>
  );
}

/**
 * Compact summary metric card with an icon chip, value, label and optional trend pill.
 * (The shared `StatCard` has no trend indicator, hence this purpose-built variant.)
 */
export default function DashboardStatCard({
  label,
  value,
  trend,
  note,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  loading = false,
}: {
  label: string;
  value: number;
  trend?: Trend;
  /** Optional sub-line under the label (e.g. attendance rate). */
  note?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  /** When set, the whole card links to this page. */
  href?: string;
  loading?: boolean;
}) {
  const baseClass =
    "group block rounded-2xl border border-[#E7CDD3]/60 bg-white p-4 shadow-[0_1px_3px_rgba(135,16,44,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(135,16,44,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none dark:hover:border-white/[0.18]";

  const inner = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={16} className={iconColor} aria-hidden="true" />
        </span>
        {loading ? null : trend ? (
          <TrendPill trend={trend} />
        ) : href ? (
          <ArrowUpRight
            size={15}
            className="text-[#E7CDD3] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#87102C] dark:text-white/20 dark:group-hover:text-[#FFB3C1]"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {loading ? (
        <>
          <div className="mb-2 h-7 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        </>
      ) : (
        <>
          <p className="font-display text-2xl font-bold leading-none tracking-tight tabular-nums text-[#111] dark:text-white">
            {value.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs font-medium tracking-wide text-[#8a7e80] dark:text-white/45">
            {label}
          </p>
          {note ? (
            <p className="mt-1 text-[11px] font-medium tabular-nums text-[#87102C]/80 dark:text-[#FFB3C1]/70">
              {note}
            </p>
          ) : null}
        </>
      )}
    </>
  );

  if (href && !loading) {
    return (
      <Link href={href} className={`${baseClass} cursor-pointer`} aria-label={`${label}: ${value.toLocaleString()}`}>
        {inner}
      </Link>
    );
  }
  return <div className={baseClass}>{inner}</div>;
}
