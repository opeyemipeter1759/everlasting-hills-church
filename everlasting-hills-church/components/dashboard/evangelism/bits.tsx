"use client";

import { AlertTriangle, Clock, Flag, Loader2 } from "lucide-react";
import type { ContactStatus, FollowUpFlag, SavedStatus, WindowState } from "@/lib/api/evangelism";
import { FLAG_LABEL, FLAG_TONE, REVIEW_LABEL, SAVED_LABEL, SAVED_TONE, STATUS_LABEL, STATUS_TONE } from "./labels";
import type { ReviewOutcome } from "@/lib/api/evangelism";

const pill = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold";

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
      <Icon size={11} aria-hidden="true" /> {FLAG_LABEL[flag]}
    </span>
  );
}

/** "Day 12 of 30" with a thin bar — or how the window ended. */
export function WindowProgress({
  window: w,
  reviewOutcome,
  compact = false,
}: {
  window: WindowState;
  reviewOutcome: ReviewOutcome | null;
  compact?: boolean;
}) {
  if (!w.open) {
    return (
      <span className="text-[11px] font-semibold text-gray-400 dark:text-white/40">
        {reviewOutcome && reviewOutcome !== "EXTENDED" ? REVIEW_LABEL[reviewOutcome] : "Follow-up finished"}
      </span>
    );
  }
  const pct = Math.min(100, Math.round((w.day / w.of) * 100));
  const bar = w.flag === "OVERDUE" ? "bg-rose-500" : w.flag === "REVIEW" ? "bg-violet-500" : w.flag === "DUE" ? "bg-amber-500" : "bg-[#87102C]";
  return (
    <div className={compact ? "w-24" : "w-full"}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-500 dark:text-white/50">
        <span>
          Day {w.day} of {w.of}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ElementType; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-8 text-center dark:border-white/15 dark:bg-white/[0.02]">
      <Icon size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/25" aria-hidden="true" />
      <p className="text-base font-semibold text-gray-700 dark:text-white/80">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400 dark:text-white/40">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
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

export const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white transition-colors hover:bg-[#6d0d24] disabled:opacity-50";
export const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10";
export const cardClass = "rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#161618]";
