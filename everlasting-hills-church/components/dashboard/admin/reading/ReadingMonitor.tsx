"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, CheckCircle2, Flame, Loader2, Moon, RefreshCw, Search, Sprout } from "lucide-react";
import { useReadingMonitor, type Reader, type ReaderState } from "@/lib/api/admin-reading";

/**
 * Bible reading across the church, for pastors and admins.
 *
 * The page exists so leaders can encourage people, so it opens on who has gone
 * quiet: a plan in progress, nothing read in a week. It is not a leaderboard,
 * and it is read-only; nothing here can change anyone's plan.
 */

const STATE: Record<ReaderState, { label: string; badge: string }> = {
  QUIET: { label: "Gone quiet", badge: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" },
  READING: { label: "Reading", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  NOT_STARTED: { label: "Not started", badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60" },
  FINISHED: { label: "Finished", badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
};
const ORDER: ReaderState[] = ["QUIET", "READING", "NOT_STARTED", "FINISHED"];
type Filter = "ALL" | ReaderState;

const DAY_MS = 86_400_000;

function lastRead(date: string | null, today: string) {
  if (!date) return "Never";
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const TONE = {
  brand: "border-[#E7CDD3]/70 bg-[#FFF4F6]/60 dark:border-[#FFB3C1]/20 dark:bg-[#87102C]/10",
  warn: "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10",
  good: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10",
  plain: "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
} as const;

export default function ReadingMonitor() {
  const { data, isLoading, isError, isFetching, refetch } = useReadingMonitor();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.readers ?? [])
      .filter((reader) => filter === "ALL" || reader.state === filter)
      .filter((reader) => !term || reader.name.toLowerCase().includes(term))
      .sort(
        (a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state) || a.name.localeCompare(b.name),
      );
  }, [data, filter, search]);

  const stats = data?.stats;
  const tiles = stats
    ? [
        { label: "Reading this week", value: stats.reading, detail: `of ${stats.activeMembers} active members`, icon: BookOpen, tone: "brand" as const },
        { label: "Gone quiet", value: stats.quiet, detail: "A plan in progress, nothing read in 7 days", icon: Moon, tone: stats.quiet ? ("warn" as const) : ("plain" as const) },
        { label: "Not started", value: stats.notStarted, detail: "Never begun a plan", icon: Sprout, tone: "plain" as const },
        { label: "Readings this week", value: stats.readingsThisWeek, detail: "Plan days read by members", icon: Flame, tone: "plain" as const },
        { label: "Plans finished", value: stats.plansCompleted, detail: "By current members", icon: CheckCircle2, tone: "good" as const },
      ]
    : [];

  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "ALL", label: "Everyone", count: stats?.activeMembers },
    { value: "QUIET", label: "Gone quiet", count: stats?.quiet },
    { value: "READING", label: "Reading", count: stats?.reading },
    { value: "NOT_STARTED", label: "Not started", count: stats?.notStarted },
    { value: "FINISHED", label: "Finished", count: stats?.finished },
  ];

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Bible reading</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
            How the church is reading, so you know who to encourage. Read-only: members only ever see
            their own progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
        >
          {isFetching ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
          Refresh
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          Reading progress could not load.{" "}
          <button type="button" onClick={() => refetch()} className="min-h-11 font-semibold underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* On a phone the headline tile takes the full width, so the other four
              pair up and none is left alone on a row. */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map(({ label, value, detail, icon: Icon, tone }, index) => (
              <div key={label} className={`min-w-0 rounded-2xl border p-4 ${TONE[tone]} ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
                  <Icon size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                  {label}
                </dt>
                <dd className="mt-1.5 text-2xl font-black tabular-nums text-[#111] dark:text-white">{value}</dd>
                <dd className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-white/45">{detail}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show">
              {filters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
                    filter === option.value
                      ? "border-transparent bg-[#87102C] text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-white/65"
                  }`}
                >
                  {option.label}
                  {option.count !== undefined && <span className="ml-1 tabular-nums opacity-75">({option.count})</span>}
                </button>
              ))}
            </div>
            <label className="relative block sm:w-64">
              <span className="sr-only">Search members</span>
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members"
                className="min-h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-[#87102C]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
          </div>

          <p role="status" className="text-xs text-gray-500 dark:text-white/50">
            Showing {rows.length} of {data?.readers.length ?? 0} active members
          </p>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
              Nobody matches this view.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:divide-white/[0.06] dark:border-white/10">
              {rows.map((reader) => (
                <ReaderRow key={reader.memberId} reader={reader} today={data!.today} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ReaderRow({ reader, today }: { reader: Reader; today: string }) {
  const state = STATE[reader.state];
  return (
    <li className="flex flex-col gap-3 bg-white px-4 py-3.5 dark:bg-white/[0.02] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {reader.photoUrl ? (
          <Image src={reader.photoUrl} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-xs font-bold text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]">
            {initials(reader.name)}
          </span>
        )}
        <div className="min-w-0">
          <Link
            href={`/dashboard/admin/members/${reader.memberId}`}
            className="block truncate text-sm font-bold text-[#111] hover:text-[#87102C] dark:text-white dark:hover:text-[#FFB3C1]"
          >
            {reader.name}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-white/50">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${state.badge}`}>{state.label}</span>
            <span>Last read {lastRead(reader.lastReadOn, today)}</span>
            {reader.currentStreak > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Flame size={11} aria-hidden="true" className="text-[#87102C] dark:text-[#FFB3C1]" />
                {reader.currentStreak}-day streak
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5 lg:max-w-[45%] lg:justify-end">
        {reader.plans.length === 0 ? (
          <span className="text-xs text-gray-400 dark:text-white/40">No plan yet</span>
        ) : (
          reader.plans.map((plan, index) => {
            const percent = plan.durationDays ? Math.min(100, Math.round((plan.completedDays / plan.durationDays) * 100)) : 0;
            return (
              <span
                key={`${plan.title}-${index}`}
                title={`${plan.title}: ${plan.completedDays} of ${plan.durationDays} days`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75"
              >
                <span className="truncate">{plan.title}</span>
                <span className="tabular-nums font-semibold text-[#87102C] dark:text-[#FFB3C1]">{percent}%</span>
                {plan.status === "PAUSED" && <span className="text-amber-700 dark:text-amber-300">paused</span>}
                {plan.status === "COMPLETED" && <span className="text-emerald-700 dark:text-emerald-400">done</span>}
              </span>
            );
          })
        )}
      </div>

      <dl className="flex shrink-0 gap-5 lg:w-32 lg:justify-end">
        <div className="text-center">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/40">7 days</dt>
          <dd className="text-sm font-bold tabular-nums text-[#111] dark:text-white">{reader.readingsLast7}</dd>
        </div>
        <div className="text-center">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/40">30 days</dt>
          <dd className="text-sm font-bold tabular-nums text-[#111] dark:text-white">{reader.readingsLast30}</dd>
        </div>
      </dl>
    </li>
  );
}
