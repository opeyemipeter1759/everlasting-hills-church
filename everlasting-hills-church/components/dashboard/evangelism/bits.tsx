"use client";

import { AlertTriangle, Clock, Flag, Loader2 } from "lucide-react";
import type { ContactStatus, FollowUpFlag, ReviewOutcome, SavedStatus, WindowState } from "@/lib/api/evangelism";
import { FLAG_LABEL, FLAG_TONE, REVIEW_LABEL, SAVED_LABEL, SAVED_TONE, STATUS_LABEL, STATUS_TONE } from "./labels";

// ── Design tokens ─────────────────────────────────────────────────────────────
// One height (40px) for every control in a toolbar, so inputs, dropdowns and
// buttons line up on the same baseline.

export const primaryButton =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl [&>svg]:shrink-0 bg-[#87102C] px-4 text-sm font-semibold text-white shadow-sm shadow-[#87102C]/20 transition-colors hover:bg-[#6d0d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 disabled:opacity-50";
export const secondaryButton =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl [&>svg]:shrink-0 border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.08]";
export const ghostButton =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white";
export const dangerButton =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl [&>svg]:shrink-0 border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-500/10";
export const iconButton =
  "inline-flex h-9 w-9 shrink-0 [&>svg]:shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white";
/** For the shared <Select>: same box as an input. */
export const selectClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80";
export const cardClass = "rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-white/10 dark:bg-[#161618]";

// ── Layout ────────────────────────────────────────────────────────────────────

/** A section title in sentence case, with an optional line under it and actions on the right. */
export function SectionHeader({
  title,
  description,
  count,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-gray-600 dark:bg-white/10 dark:text-white/60">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-white/50">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A card with a titled header row and a body. */
export function Panel({
  title,
  description,
  count,
  actions,
  children,
  flush = false,
  className = "",
}: {
  title: string;
  description?: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Body without padding — for lists and tables that run edge to edge. */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`${cardClass} overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.06] sm:items-center">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            {title}
            {typeof count === "number" && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600 dark:bg-white/10 dark:text-white/60">
                {count}
              </span>
            )}
          </h3>
          {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">{description}</p>}
        </div>
        {actions}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

/** Initials in a soft burgundy circle — for people without a photo. */
export function Initials({ name, size = 36, single = false }: { name: string; size?: number; single?: boolean }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, single ? 1 : 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] font-semibold text-[#87102C] dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
    >
      {letters || "?"}
    </span>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

const pill = "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium";

export function SavedBadge({ status }: { status: SavedStatus }) {
  return <span className={`${pill} ${SAVED_TONE[status]}`}>{SAVED_LABEL[status]}</span>;
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  return <span className={`${pill} ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function FlagBadge({ flag }: { flag: FollowUpFlag }) {
  const Icon = flag === "OVERDUE" ? AlertTriangle : flag === "REVIEW" ? Flag : Clock;
  return (
    <span className={`${pill} ${FLAG_TONE[flag]}`}>
      <Icon size={12} aria-hidden="true" /> {FLAG_LABEL[flag]}
    </span>
  );
}

/** "Day 12 of 30" and a thin bar coloured by urgency — or how the window ended. */
export function WindowProgress({ window: w, reviewOutcome }: { window: WindowState; reviewOutcome: ReviewOutcome | null }) {
  if (!w.open) {
    return (
      <span className="text-xs text-gray-400 dark:text-white/40">
        {reviewOutcome && reviewOutcome !== "EXTENDED" ? REVIEW_LABEL[reviewOutcome] : "Finished"}
      </span>
    );
  }
  const pct = Math.min(100, Math.max(4, Math.round((w.day / w.of) * 100)));
  const bar =
    w.flag === "OVERDUE" ? "bg-rose-500" : w.flag === "REVIEW" ? "bg-violet-500" : w.flag === "DUE" ? "bg-amber-500" : "bg-[#87102C] dark:bg-[#FFB3C1]";
  return (
    <div className="w-full min-w-[7rem]">
      <div className="flex items-baseline justify-between gap-2 whitespace-nowrap text-xs">
        <span className="font-medium tabular-nums text-gray-700 dark:text-white/80">
          Day {w.day}
          <span className="font-normal text-gray-400"> / {w.of}</span>
        </span>
        {w.flag && (
          <span
            className={`font-semibold ${
              w.flag === "OVERDUE" ? "text-rose-600 dark:text-rose-400" : w.flag === "REVIEW" ? "text-violet-600 dark:text-violet-300" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {FLAG_LABEL[w.flag]}
          </span>
        )}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── States ────────────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ElementType; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-white/40">
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-white/50">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-gray-400">
      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
      {children}
    </p>
  );
}
