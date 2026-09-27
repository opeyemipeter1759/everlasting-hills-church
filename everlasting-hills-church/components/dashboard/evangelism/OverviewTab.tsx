"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ChevronRight, Hourglass, ListChecks } from "lucide-react";
import { useMe } from "@/lib/api";
import { useEvangelismContacts, useEvangelismTasks, type ContactRow, type EvangelismSummary, type EvangelismTask } from "@/lib/api/evangelism";
import { EmptyState, ErrorNote, Initials, Loading, Panel, WindowProgress } from "./bits";
import { SummaryPanel } from "./SummaryPanel";
import { STATUS_LABEL, TASK_TYPE_LABEL, errorText, fmtDate } from "./labels";
import type { EvangelismTab } from "./EvangelismBoard";

const URGENCY: Record<string, number> = { OVERDUE: 0, DUE: 1, REVIEW: 2 };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Today at a glance: the figures, then what needs you — your people in their
 * 30-day window (most urgent first), your tasks and, for leaders, the contacts
 * whose 30 days are up.
 */
export function OverviewTab({
  canLead,
  summary,
  onOpenContact,
  onGoTo,
}: {
  canLead: boolean;
  summary: UseQueryResult<EvangelismSummary>;
  onOpenContact: (id: string) => void;
  onGoTo: (tab: EvangelismTab) => void;
}) {
  const { data: me } = useMe();
  const mine = useEvangelismContacts({ mine: true, take: 50 });
  const tasks = useEvangelismTasks("mine");
  const review = useEvangelismContacts({ flag: "REVIEW", take: 6 });
  const s = summary.data;

  const people = [...(mine.data?.data ?? [])].sort(
    (a, b) => (URGENCY[a.window.flag ?? ""] ?? 3) - (URGENCY[b.window.flag ?? ""] ?? 3) || b.daysSinceContact - a.daysSinceContact,
  );
  const openTasks = (tasks.data ?? []).filter((t) => t.status !== "DONE");
  const firstName = me?.member?.firstName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white/50">
          {s
            ? s.mine.inWindow > 0
              ? `You're following up ${s.mine.inWindow} ${s.mine.inWindow === 1 ? "person" : "people"}${s.mine.overdue ? ` — ${s.mine.overdue} overdue` : ""}.`
              : "Nobody is waiting on you right now."
            : " "}
        </p>
      </div>

      <SummaryPanel summary={s} loading={summary.isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Needs your attention"
          description="Your contacts in their 30-day follow-up, most urgent first"
          count={mine.data?.total}
          className="lg:col-span-2"
          flush
          actions={
            <button type="button" onClick={() => onGoTo("contacts")} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
              All contacts <ArrowRight size={14} aria-hidden="true" />
            </button>
          }
        >
          {mine.isLoading ? (
            <Loading />
          ) : mine.isError ? (
            <div className="p-5">
              <ErrorNote>{errorText(mine.error, "Couldn't load your contacts.")}</ErrorNote>
            </div>
          ) : people.length === 0 ? (
            <EmptyState icon={Hourglass} title="You're all caught up" body="People you preach to appear here for 30 days of follow-up." />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {people.slice(0, 8).map((c) => (
                <AttentionRow key={c.id} contact={c} onOpen={onOpenContact} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="My tasks"
            count={openTasks.length}
            flush
            actions={
              <button type="button" onClick={() => onGoTo("tasks")} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                View <ArrowRight size={14} aria-hidden="true" />
              </button>
            }
          >
            {tasks.isLoading ? (
              <Loading />
            ) : openTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No open tasks" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {openTasks.slice(0, 5).map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={() => onGoTo("tasks")} />
                ))}
              </ul>
            )}
          </Panel>

          {canLead && (review.data?.total ?? 0) > 0 && (
            <Panel title="Waiting for your review" description="Their 30 days are up — hand over, extend or close" count={review.data?.total} flush>
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {(review.data?.data ?? []).map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onOpenContact(c.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <Initials name={c.name} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-white/45">
                          {STATUS_LABEL[c.status]} · {c.worker.name}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function AttentionRow({ contact: c, onOpen }: { contact: ContactRow; onOpen: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(c.id)}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:grid-cols-[auto_1fr_11rem_auto] sm:gap-4"
      >
        <Initials name={c.name} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
          <p className="truncate text-xs text-gray-500 dark:text-white/45">
            {STATUS_LABEL[c.status]}
            {c.outreach ? ` · ${c.outreach.name}` : ""}
          </p>
        </div>
        <div className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
          <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} />
        </div>
        <ChevronRight size={16} className="text-gray-300" aria-hidden="true" />
      </button>
    </li>
  );
}

function TaskRow({ task: t, onOpen }: { task: EvangelismTask; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            t.overdue ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50"
          }`}
        >
          {t.overdue ? <AlertTriangle size={14} aria-hidden="true" /> : <ListChecks size={14} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
          <p className={`mt-0.5 flex items-center gap-1 text-xs ${t.overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-white/45"}`}>
            {TASK_TYPE_LABEL[t.type]}
            {t.dueAt && (
              <>
                <span aria-hidden="true">·</span>
                <CalendarClock size={12} aria-hidden="true" /> {t.overdue ? "Overdue" : `Due ${fmtDate(t.dueAt)}`}
              </>
            )}
          </p>
        </div>
      </button>
    </li>
  );
}
