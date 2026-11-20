"use client";

import Link from "next/link";
import { useOverview, type Overview } from "@/lib/api/premarital";
import { PageHeader, QueryState, card } from "./ui";

const TILES: { key: keyof Overview; label: string; href?: string }[] = [
  { key: "total", label: "Total applications", href: "/dashboard/marriage/applications" },
  { key: "new", label: "New", href: "/dashboard/marriage/applications?status=SUBMITTED" },
  { key: "awaitingReview", label: "Awaiting review", href: "/dashboard/marriage/applications?status=UNDER_REVIEW" },
  { key: "inCounselling", label: "In counselling", href: "/dashboard/marriage/applications?status=IN_COUNSELLING" },
  { key: "upcomingSessions", label: "Sessions in the next 2 weeks", href: "/dashboard/marriage/sessions" },
  { key: "needsAttention", label: "Need attention" },
  { key: "completed", label: "Completed", href: "/dashboard/marriage/applications?status=COMPLETED" },
];

/** Counts only. No names or details on these cards. */
export default function OverviewClient() {
  const q = useOverview();
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader title="Pre-marital counselling" subtitle="Where every application stands. Open Applications to work on a case." />
      <QueryState isLoading={q.isLoading} error={q.error} />
      {q.data && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TILES.map((t) => {
            const body = (
              <>
                <span className="block text-3xl font-bold tabular-nums text-[#111] dark:text-white">{q.data[t.key]}</span>
                <span className="mt-1 block text-sm text-gray-600 dark:text-white/60">{t.label}</span>
              </>
            );
            return (
              <li key={t.key}>
                {t.href ? (
                  <Link href={t.href} className={`${card} block hover:border-[#87102C]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]`}>
                    {body}
                  </Link>
                ) : (
                  <div className={card}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {q.data && q.data.needsAttention > 0 && (
        <p className="text-sm text-gray-600 dark:text-white/60">
          Needing attention means waiting for information from the couple, or accepted with no lead counsellor yet.
        </p>
      )}
    </div>
  );
}
