"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, HeartHandshake } from "lucide-react";
import { usePreMaritalApplications } from "@/lib/api/pre-marital";
import { STATUS_OPTIONS, type ApplicationStatus } from "@/lib/pre-marital/schema";
import { StatusBadge, coupleName, longDate } from "./StatusBadge";

/**
 * Pastoral → Pre-Marital Counselling: every application from the public form,
 * newest first, by status. Open one to read it in full and move it on.
 */
export default function ApplicationsClient() {
  const [status, setStatus] = useState<ApplicationStatus | undefined>("NEW");
  const q = usePreMaritalApplications(status);
  const counts = q.data?.counts;
  const total = counts ? counts.NEW + counts.IN_REVIEW + counts.CLOSED : null;
  const tabs = [...STATUS_OPTIONS.map((o) => ({ value: o.value as ApplicationStatus | undefined, label: o.label, n: counts?.[o.value] })), { value: undefined, label: "All", n: total }];

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#87102C]/10 dark:bg-[#87102C]/20">
          <HeartHandshake size={20} className="text-[#87102C] dark:text-[#f3a9b8]" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[#111] dark:text-white">Pre-Marital Counselling</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
            Applications from couples on the website. Open one to read it and set where it stands.
          </p>
        </div>
      </header>

      <div role="tablist" aria-label="Show applications by status" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={status === t.value}
            onClick={() => setStatus(t.value)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${
              status === t.value ? "bg-[#87102C] text-white" : "border border-gray-200 text-gray-700 hover:border-[#87102C]/40 dark:border-white/15 dark:text-white/75"
            }`}
          >
            {t.label}
            {t.n != null && <span className="ml-1.5 opacity-75">{t.n}</span>}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="space-y-2" aria-label="Loading applications">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : q.isError ? (
        <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {(q.error as { status?: number }).status === 403
            ? "Only the pastoral team can see these applications."
            : "The applications could not be loaded. Check your connection and try again."}
        </p>
      ) : (q.data?.items.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
          {status ? "No applications here right now." : "No applications yet. They appear here as soon as a couple applies on the website."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-white/[0.06] dark:border-white/10 dark:bg-[#161618]">
          {q.data!.items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/pastor/pre-marital-counselling/${a.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:hover:bg-white/[0.03]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#111] dark:text-white">{coupleName(a)}</span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-white/50">
                    Applied {longDate(a.submittedAt)} · {a.referenceCode}
                  </span>
                </span>
                <StatusBadge status={a.status} />
                <ChevronRight size={16} className="flex-shrink-0 text-gray-400 dark:text-white/40" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
