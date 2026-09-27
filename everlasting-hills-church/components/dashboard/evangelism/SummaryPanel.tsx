"use client";

import { AlertTriangle, Church, HeartHandshake, Home, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EvangelismSummary } from "@/lib/api/evangelism";
import { cardClass } from "./bits";

interface Figure {
  icon: LucideIcon;
  label: string;
  value?: number;
  detail?: string;
  tone: string;
}

/**
 * The four numbers that matter, in one panel with hairline dividers rather
 * than six separate boxes — then the smaller signals as a line beneath.
 */
export function SummaryPanel({ summary: s, loading }: { summary?: EvangelismSummary; loading: boolean }) {
  const figures: Figure[] = [
    { icon: Users, label: "People reached", value: s?.reached, detail: s && `+${s.reachedThisMonth} this month`, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/15 dark:text-violet-300" },
    { icon: HeartHandshake, label: "Saved", value: s?.saved, detail: s && `+${s.savedThisMonth} this month`, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300" },
    {
      icon: AlertTriangle,
      label: "Follow-ups pending",
      value: s?.pendingFollowUps,
      detail: s && `${s.overdueFollowUps} overdue · ${s.dueFollowUps} due`,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300",
    },
    { icon: Church, label: "Invited to church", value: s?.invited, detail: s && `${s.attended} attended`, tone: "text-[#87102C] bg-[#FFE8ED] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]" },
  ];

  return (
    <section aria-label="Summary" className={`${cardClass} overflow-hidden`}>
      <dl className="grid grid-cols-2 lg:grid-cols-4">
        {figures.map((f, i) => (
          <div
            key={f.label}
            className={`p-4 sm:p-5 ${i % 2 === 1 ? "border-l border-gray-100 dark:border-white/[0.06]" : ""} ${
              i >= 2 ? "border-t border-gray-100 dark:border-white/[0.06] lg:border-t-0" : ""
            } ${i === 2 ? "lg:border-l" : ""}`}
          >
            <dt className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-white/50 sm:text-sm">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${f.tone}`}>
                <f.icon size={15} aria-hidden="true" />
              </span>
              {f.label}
            </dt>
            <dd className="mt-3">
              {loading || f.value === undefined ? (
                <span className="block h-8 w-16 animate-pulse rounded-md bg-gray-100 dark:bg-white/10" />
              ) : (
                <span className="text-2xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white sm:text-3xl">{f.value}</span>
              )}
              {f.detail && <span className="mt-1 block text-xs text-gray-500 dark:text-white/45">{f.detail}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {s && (s.visitationsNeeded > 0 || s.awaitingReview > 0) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-gray-100 bg-gray-50/60 px-5 py-2.5 text-xs text-gray-600 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-white/60">
          {s.visitationsNeeded > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Home size={13} className="text-orange-500" aria-hidden="true" /> {s.visitationsNeeded} need a visit
            </span>
          )}
          {s.awaitingReview > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" /> {s.awaitingReview} waiting for a leader&apos;s review
            </span>
          )}
        </div>
      )}
    </section>
  );
}
