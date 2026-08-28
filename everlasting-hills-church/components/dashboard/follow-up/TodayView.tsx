"use client";

import { addDays } from "date-fns";
import { CheckCircle2, Clock3, Phone } from "lucide-react";
import type { FollowUpEntry } from "@/types/follow-up";
import { useFollowUpEntries, useSnoozeFollowUp } from "@/lib/api/follow-up-pipeline";
import { timeAgo } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { PersonAvatar } from "./PersonAvatar";
import { DueStatusPill, SourceTypePill } from "./StagePill";

interface TodayViewProps {
  onSelect: (entry: FollowUpEntry) => void;
}

/** The viewer's own working queue for right now — overdue first, then due, with
 * snoozed/caught-up entries excluded entirely (they don't need attention today). */
export function TodayView({ onSelect }: TodayViewProps) {
  const { data: entries = [], isLoading } = useFollowUpEntries({ mine: true });
  const snoozeEntry = useSnoozeFollowUp();

  const due = entries
    .filter((e) => e.viewerCanWork && (e.dueStatus === "OVERDUE" || e.dueStatus === "DUE"))
    .sort((a, b) => (a.dueStatus === b.dueStatus ? 0 : a.dueStatus === "OVERDUE" ? -1 : 1));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3.5">
            <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (due.length === 0) {
    return (
      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl">
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up 🎉"
          description="Nothing needs your attention right now. Check back after your next contact goal."
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
      <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
        {due.map((entry) => (
          <li key={entry.id} className="flex items-center gap-4 px-6 py-3.5">
            <button type="button" onClick={() => onSelect(entry)} className="flex-1 min-w-0 flex items-center gap-4 text-left">
              <PersonAvatar person={entry.person} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-[#111] dark:text-white truncate">{entry.person.name}</p>
                  <SourceTypePill type={entry.sourceType} />
                  <DueStatusPill status={entry.dueStatus} />
                </div>
                <p className="text-xs text-[#8a7e80] dark:text-white/40 mt-0.5 flex items-center gap-1">
                  <Clock3 size={10} aria-hidden="true" />
                  {entry.lastContactAt ? `Last contact ${timeAgo(entry.lastContactAt)}` : "Never contacted"}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.person.phone && (
                <a
                  href={`tel:${entry.person.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Call ${entry.person.name}`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 hover:bg-[#FFD8E1] dark:hover:bg-[#87102C]/40 transition-colors"
                >
                  <Phone size={13} aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                onClick={() => snoozeEntry.mutate({ id: entry.id, until: addDays(new Date(), 1).toISOString() })}
                disabled={snoozeEntry.isPending}
                title="Snooze until tomorrow"
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Snooze
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
