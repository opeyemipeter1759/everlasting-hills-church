"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Eraser,
  Flame,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { userMessageForError } from "@/lib/api/user-message";
import {
  useClearGoneQuiet,
  useReadingMonitor,
  useRemoveMemberPlan,
  type Reader,
  type ReaderPlan,
  type ReaderState,
} from "@/lib/api/admin-reading";
import { useReadingPlans } from "@/lib/api/reading-plan";
import SharePlanDialog from "@/components/dashboard/member/reading-plan/SharePlanDialog";

/**
 * Bible reading across the church, for pastors and admins.
 *
 * The page exists so leaders can encourage people, so it opens on who has gone
 * quiet: a plan over a week old with nothing read in it this week. Someone who
 * began a plan this week has just started, not gone quiet. It is not a
 * leaderboard. Every number above the list is a button that shows the people
 * behind it.
 *
 * Admins can tidy reading here: remove one member's plan, or clear gone quiet
 * in one step. Both remove plans the way a member's own Remove does, so their
 * reading history stays. Sharing a plan only sends a notification.
 */

const STATE: Record<ReaderState, { label: string; badge: string }> = {
  QUIET: { label: "Gone quiet", badge: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" },
  NEW: { label: "Just started", badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" },
  READING: { label: "Reading", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  NOT_STARTED: { label: "No plan", badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60" },
  FINISHED: { label: "Finished", badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
};
const ORDER: ReaderState[] = ["QUIET", "NEW", "READING", "NOT_STARTED", "FINISHED"];
/** One group of people: a state, everyone, or anyone who has finished a plan. */
type Filter = "ALL" | ReaderState | "HAS_FINISHED";

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

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

function inGroup(reader: Reader, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "HAS_FINISHED") return reader.plans.some((plan) => plan.status === "COMPLETED");
  return reader.state === filter;
}

const TONE = {
  brand: "border-[#E7CDD3]/70 bg-[#FFF4F6]/60 dark:border-[#FFB3C1]/20 dark:bg-[#87102C]/10",
  warn: "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10",
  good: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10",
  plain: "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
} as const;

interface Tile {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: keyof typeof TONE;
  /** The group of people this number is about, shown when the tile is pressed. */
  filter: Filter;
}

export default function ReadingMonitor() {
  const { data, isLoading, isError, isFetching, refetch } = useReadingMonitor();
  const { data: plans, isLoading: plansLoading } = useReadingPlans();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shared, setShared] = useState<{ title: string; recipients: number } | null>(null);

  const clearGoneQuiet = useClearGoneQuiet();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [cleared, setCleared] = useState<{ removedPlans: number; members: number } | null>(null);
  const clearable = data?.clearable;

  const removeMemberPlan = useRemoveMemberPlan();
  const [removing, setRemoving] = useState<{ reader: Reader; plan: ReaderPlan } | null>(null);
  const [removedPlan, setRemovedPlan] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmClear() {
    if (!clearable) return;
    setActionError(null);
    try {
      setCleared(await clearGoneQuiet.mutateAsync(clearable.plans));
    } catch (cause) {
      setActionError(userMessageForError(cause, "Could not clear gone quiet. Refresh the page and try again."));
    } finally {
      setConfirmingClear(false);
    }
  }

  async function confirmRemovePlan() {
    if (!removing?.plan.subscriptionId) return;
    setActionError(null);
    try {
      await removeMemberPlan.mutateAsync(removing.plan.subscriptionId);
      setRemovedPlan(`Removed ${removing.plan.title} from ${removing.reader.name}. The days they read stay in their history.`);
    } catch (cause) {
      setActionError(userMessageForError(cause, "Could not remove this plan. Please try again."));
    } finally {
      setRemoving(null);
    }
  }

  /** A tile shows the people behind its number. */
  function showGroup(next: Filter) {
    setFilter(next);
    setSearch("");
    listRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.readers ?? [])
      .filter((reader) => inGroup(reader, filter))
      .filter((reader) => !term || reader.name.toLowerCase().includes(term))
      .sort(
        (a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state) || a.name.localeCompare(b.name),
      );
  }, [data, filter, search]);

  const stats = data?.stats;
  const finishedSomething = (data?.readers ?? []).filter((reader) => inGroup(reader, "HAS_FINISHED")).length;
  const tiles: Tile[] = stats
    ? [
        { label: "Reading", value: stats.reading, detail: `of ${stats.activeMembers} members read in the last 7 days`, icon: BookOpen, tone: "brand", filter: "READING" },
        { label: "Days read this week", value: stats.readingsThisWeek, detail: `by the ${plural(stats.reading, "person", "people")} reading`, icon: Flame, tone: "plain", filter: "READING" },
        { label: "Just started", value: stats.justStarted ?? 0, detail: "Began a plan this week, nothing read yet", icon: Sparkles, tone: "plain", filter: "NEW" },
        { label: "Gone quiet", value: stats.quiet, detail: "A plan over a week old, nothing read in 7 days", icon: Moon, tone: stats.quiet ? "warn" : "plain", filter: "QUIET" },
        { label: "No plan", value: stats.notStarted, detail: "Not on any plan right now", icon: CircleDashed, tone: "plain", filter: "NOT_STARTED" },
        { label: "Plans finished", value: stats.plansCompleted, detail: `by ${plural(finishedSomething, "member")}`, icon: CheckCircle2, tone: "good", filter: "HAS_FINISHED" },
      ]
    : [];

  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "ALL", label: "Everyone", count: stats?.activeMembers },
    { value: "QUIET", label: "Gone quiet", count: stats?.quiet },
    { value: "NEW", label: "Just started", count: stats?.justStarted },
    { value: "READING", label: "Reading", count: stats?.reading },
    { value: "NOT_STARTED", label: "No plan", count: stats?.notStarted },
    { value: "HAS_FINISHED", label: "Finished a plan", count: stats ? finishedSomething : undefined },
  ];

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Bible reading</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
            How the church is reading, so you know who to encourage. Members only ever see their own
            progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            disabled={plansLoading || !plans?.length}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60"
          >
            {plansLoading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
            Share a plan
          </button>
          <button
            type="button"
            onClick={() => { setActionError(null); setConfirmingClear(true); }}
            disabled={!clearable?.plans || clearGoneQuiet.isPending}
            title={clearable?.plans ? undefined : "Nobody's plan has been quiet for over a week"}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:disabled:border-white/10 dark:disabled:text-white/35"
          >
            <Eraser size={15} aria-hidden="true" />
            Clear gone quiet
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            {isFetching ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
            Refresh
          </button>
        </div>
      </header>

      {cleared && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          Removed {plural(cleared.removedPlans, "plan")} from {plural(cleared.members, "member")}. Their reading history stays, and plans started this week were kept.
        </p>
      )}
      {removedPlan && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          {removedPlan}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}
      {shared && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          {shared.title} was shared with {shared.recipients} {shared.recipients === 1 ? "member" : "members"}.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
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
          <div role="group" aria-label="Reading at a glance" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              const selected = filter === tile.filter;
              return (
                <button
                  key={tile.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => showGroup(tile.filter)}
                  className={`min-w-0 rounded-2xl border p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C] dark:focus-visible:ring-[#FFB3C1] ${TONE[tile.tone]} ${selected ? "ring-2 ring-[#87102C]/50 dark:ring-[#FFB3C1]/50" : ""}`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
                    <Icon size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                    {tile.label}
                  </span>
                  <span className="mt-1.5 block text-2xl font-black tabular-nums text-[#111] dark:text-white">{tile.value}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-gray-500 dark:text-white/45">{tile.detail}</span>
                </button>
              );
            })}
          </div>

          <div ref={listRef} className="flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <ReaderRow
                  key={reader.memberId}
                  reader={reader}
                  today={data!.today}
                  onRemovePlan={(plan) => { setActionError(null); setRemoving({ reader, plan }); }}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {clearable && (
        <ConfirmDialog
          open={confirmingClear}
          tone="danger"
          title="Clear gone quiet?"
          description={`This removes ${plural(clearable.plans, "plan")} from ${plural(clearable.members, "member")} who have read nothing in the last 7 days. Plans started this week stay. Nothing is deleted: their reading history stays, and they can choose a plan again at any time.`}
          confirmLabel={`Remove ${plural(clearable.plans, "plan")}`}
          cancelLabel="Keep them"
          loading={clearGoneQuiet.isPending}
          onConfirm={confirmClear}
          onCancel={() => setConfirmingClear(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        tone="danger"
        title={removing ? `Remove ${removing.plan.title} from ${removing.reader.name}?` : "Remove this plan?"}
        description="It leaves their plans and this page. The days they have read stay in their history, and they can choose the plan again at any time."
        confirmLabel="Remove plan"
        cancelLabel="Keep it"
        loading={removeMemberPlan.isPending}
        onConfirm={confirmRemovePlan}
        onCancel={() => setRemoving(null)}
      />

      <SharePlanDialog
        open={shareOpen}
        plans={plans ?? []}
        onClose={() => setShareOpen(false)}
        onShared={(result) => {
          setShared(result);
          setShareOpen(false);
        }}
      />
    </div>
  );
}

function ReaderRow({ reader, today, onRemovePlan }: { reader: Reader; today: string; onRemovePlan: (plan: ReaderPlan) => void }) {
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
            // A finished plan is history; only plans in progress or paused can be removed.
            const removable = Boolean(plan.subscriptionId) && plan.status !== "COMPLETED";
            return (
              <span
                key={plan.subscriptionId ?? `${plan.title}-${index}`}
                title={`${plan.title}: ${plan.completedDays} of ${plan.durationDays} days`}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-2.5 text-[11px] text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75 ${removable ? "pr-1" : "pr-2.5"}`}
              >
                <span className="truncate">{plan.title}</span>
                <span className="tabular-nums font-semibold text-[#87102C] dark:text-[#FFB3C1]">{percent}%</span>
                {plan.status === "PAUSED" && <span className="text-amber-700 dark:text-amber-300">paused</span>}
                {plan.status === "COMPLETED" && <span className="text-emerald-700 dark:text-emerald-400">done</span>}
                {removable && (
                  <button
                    type="button"
                    onClick={() => onRemovePlan(plan)}
                    aria-label={`Remove ${plan.title} from ${reader.name}`}
                    title="Remove this plan"
                    className="-my-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
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
