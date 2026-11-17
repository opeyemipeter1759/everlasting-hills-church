"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { FirstTimerPrayerPoint } from "@/lib/api/prayer-requests";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

/**
 * The prayer requests first-timers wrote on the form, newest first: who, when
 * they first came, what they asked, and their profile. Only pastors and admins
 * get these from the API.
 */
export default function FirstTimerPrayerPoints({ q }: { q: UseQueryResult<FirstTimerPrayerPoint[]> }) {
  if (q.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading" />;
  if (q.isError) return <p className="text-sm text-rose-600 dark:text-rose-300">These could not be loaded. Refresh to try again.</p>;
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
        No first-timer has written a prayer request yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.visitorId} className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#161618]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
            <p className="text-xs text-gray-500 dark:text-white/45">First visit {day(r.firstVisitDate ? `${r.firstVisitDate}T12:00:00Z` : r.submittedAt)}</p>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-white/75">{r.prayerPoint}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <Link href={`/dashboard/follow-up/person/${r.visitorId}`} className="text-[#87102C] hover:underline dark:text-[#e8768a]">
              Open their profile
            </Link>
            {r.phone && (
              <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-white/60">
                <Phone size={12} aria-hidden="true" /> Call
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
