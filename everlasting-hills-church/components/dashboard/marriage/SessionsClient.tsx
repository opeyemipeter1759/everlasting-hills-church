"use client";

import Link from "next/link";
import { useSessions } from "@/lib/api/premarital";
import { PageHeader, QueryState, card, coupleName, lagosDay, lagosDateTime } from "./ui";

const dayHeading = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** The next two months of sessions, by Lagos day. Counsellors see only their own. */
export default function SessionsClient() {
  const q = useSessions({});
  const upcoming = (q.data ?? []).filter((s) => s.status === "SCHEDULED");
  const byDay = new Map<string, typeof upcoming>();
  for (const s of upcoming) byDay.set(lagosDay(s.scheduledAt), [...(byDay.get(lagosDay(s.scheduledAt)) ?? []), s]);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader title="Sessions" subtitle="Booked sessions for the next two months, in Lagos time. Open a case to move or cancel one." />
      <QueryState isLoading={q.isLoading} error={q.error} />
      {q.data && upcoming.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-white/15 dark:text-white/60">
          No sessions booked. Book one from a case that has been accepted for counselling.
        </p>
      )}
      {Array.from(byDay.entries()).map(([day, sessions]) => (
        <section key={day} aria-label={dayHeading(day)}>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-white/70">{dayHeading(day)}</h2>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/marriage/applications/${s.applicationId}`}
                  className={`${card} block hover:border-[#87102C]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]`}
                >
                  <span className="block text-sm font-semibold text-[#111] dark:text-white">{s.Application ? coupleName(s.Application) : "A couple"}</span>
                  <span className="mt-0.5 block text-sm text-gray-600 dark:text-white/60">
                    {lagosDateTime(s.scheduledAt)} · {s.format === "ONLINE" ? "Online" : s.location} · {s.durationMinutes} min
                    {s.counsellorName ? ` · ${s.counsellorName}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
