"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { usePlanDays, type ReadingPlanSummary } from "@/lib/api/reading-plan";

const PAGE_SIZE = 30;

/**
 * Everything a plan holds, before anyone commits to it: the cover, what it is,
 * and every day's reading, a month at a time. Nothing here subscribes; the
 * start button hands back to the chooser's own start dialog.
 */
export default function PlanPreviewDialog({
  plan,
  onClose,
  onStart,
  startLabel = "Start this plan",
}: {
  plan: ReadingPlanSummary | null;
  onClose: () => void;
  onStart?: (plan: ReadingPlanSummary) => void;
  startLabel?: string;
}) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [plan?.id]);
  const { data, isLoading, isError, refetch } = usePlanDays(plan?.id, page, PAGE_SIZE);
  const total = data?.meta.total ?? plan?.durationDays ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  return (
    <Modal open={Boolean(plan)} onClose={onClose} title="Plan preview" maxWidth="lg">
      {plan && (
        <div className="space-y-4">
          {plan.coverImageUrl && (
            <div className="relative h-36 overflow-hidden rounded-xl bg-[#4A0817]">
              <Image src={plan.coverImageUrl} alt="" fill sizes="520px" className="object-cover" unoptimized />
            </div>
          )}
          <div>
            <p className="break-words font-serif text-xl font-bold text-gray-900 dark:text-white">{plan.title}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/60">
              <Clock size={13} aria-hidden="true" />
              {plan.durationDays} days{plan.avgMinutesPerDay != null ? ` · about ${plan.avgMinutesPerDay} min/day` : ""}
            </p>
            {plan.description && <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/65">{plan.description}</p>}
          </div>

          <section aria-label="Every day's reading">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white/85">
                {pages > 1 ? `Days ${from}–${to} of ${total}` : "Every day's reading"}
              </h3>
              {pages > 1 && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Earlier days" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-white/70"><ChevronLeft size={16} /></button>
                  <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= pages} aria-label="Later days" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-white/70"><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
            {isLoading ? (
              <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> Loading the readings…</p>
            ) : isError || !data ? (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                Could not load the readings. <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
              </p>
            ) : (
              <ol className="mt-2 max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10">
                {data.days.map((day) => (
                  <li key={day.dayIndex} className="flex items-start gap-3 px-3 py-2 text-sm">
                    <span className="w-14 shrink-0 text-xs font-bold text-[#87102C] dark:text-[#FFB3C1]">Day {day.dayIndex}</span>
                    <span className="min-w-0 flex-1 break-words text-gray-800 dark:text-white/80">{day.referenceLabel}</span>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-white/40">{day.estimatedMinutes} min</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 dark:border-white/10 dark:text-white/70">Close</button>
            {onStart && (
              <button type="button" onClick={() => onStart(plan)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white hover:bg-[#6E0C24]">
                <BookOpen size={15} aria-hidden="true" /> {startLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
