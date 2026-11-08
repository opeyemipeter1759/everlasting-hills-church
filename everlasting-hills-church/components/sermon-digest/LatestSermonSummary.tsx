"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, PlayCircle, Sparkles } from "lucide-react";
import { serviceLabel, useLatestSummary } from "@/lib/sermon-digest";

/**
 * The latest sermon, summarised from the service video on YouTube: title,
 * preacher, what was preached, three key points, the passages read, and a
 * button that opens the video where the sermon starts.
 *
 * `compact` (the member home page) shows the title and a short summary, with
 * the key points and passages a tap away, so it sits beside the other cards
 * instead of running down the page.
 */
export default function LatestSermonSummary({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useLatestSummary();
  const [expanded, setExpanded] = useState(false);
  const full = !compact || expanded;

  if (isLoading) {
    return (
      <section aria-label="Loading the latest sermon summary" className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="h-3 w-32 rounded bg-gray-100 dark:bg-white/10" />
        <div className="mt-4 h-7 w-2/3 rounded bg-gray-100 dark:bg-white/10" />
        <div className="mt-4 h-24 rounded bg-gray-100 dark:bg-white/10" />
      </section>
    );
  }

  if (!data?.ready) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-rose-300">Latest sermon</p>
        <h2 className="mt-1.5 text-base font-bold text-gray-900 dark:text-white">The summary of our latest sermon is on its way</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We summarise each Sunday and Wednesday sermon a few hours after the service ends. Check back soon.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="latest-sermon-title" className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
      <div className="p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-rose-300">
          Latest sermon · {serviceLabel(data.serviceDay, data.serviceDate)}
        </p>
        <h2 id="latest-sermon-title" className="mt-1.5 text-base font-bold leading-snug text-gray-900 dark:text-white">
          {data.sermonTitle}
        </h2>
        {data.preacher && <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">{data.preacher}</p>}

        <p className={`mt-3 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-200 ${full ? "" : "line-clamp-3"}`}>{data.summary}</p>
        {compact && (
          <button type="button" onClick={() => setExpanded((open) => !open)} aria-expanded={expanded} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#87102C] hover:underline dark:text-rose-300">
            {expanded ? "Show less" : "Read full summary"}
            <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}

        {full && data.keyPoints.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Key points</h3>
            <ol className="mt-2 space-y-2">
              {data.keyPoints.map((point, index) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-xs font-bold text-[#87102C] dark:bg-rose-300/10 dark:text-rose-300">
                    {index + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </div>
        )}

        {full && data.bibleReferences.length > 0 && (
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <BookOpen size={15} aria-hidden="true" />
              Scriptures read
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.bibleReferences.map((ref) => (
                <li key={ref} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/15 dark:text-gray-200">
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Sparkles size={14} className="text-[#87102C] dark:text-[#f5d49a]" aria-hidden="true" />
          Word of the Day: <strong className="text-gray-900 dark:text-white">{data.wordOfTheDay.word}</strong>
        </p>
        <a
          href={data.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-semibold text-white transition hover:bg-[#6d0d24]"
        >
          <PlayCircle size={16} aria-hidden="true" />
          Watch the sermon
        </a>
      </div>
    </section>
  );
}
