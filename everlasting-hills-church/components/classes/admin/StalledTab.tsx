"use client";

import Link from "next/link";
import { useStalled } from "@/lib/api/classes";
import { ClassError, ClassLoading, formatDate } from "../shared";

/** Learners with no progress for three weeks. Their access is never removed. */
export default function StalledTab() {
  const { data, isLoading, error, refetch } = useStalled();
  if (isLoading) return <ClassLoading />;
  if (error || !data) return <ClassError error={error} onRetry={() => refetch()} />;
  if (data.length === 0) return <p className="text-black/60 dark:text-white/60">Everyone is moving. No one has stalled.</p>;
  return (
    <ul className="space-y-3">
      {data.map((s) => (
        <li key={s.enrollmentId} className="flex flex-col gap-1 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.04]">
          <span>
            <Link href={`/dashboard/admin/members/${s.member.id}`} className="block font-semibold text-[var(--color-ink)] hover:underline dark:text-white">
              {s.member.name}
            </Link>
            <span className="block text-sm text-black/60 dark:text-white/60">
              {s.class.title}, {s.cohort.name} · last active {s.lastActivityAt ? formatDate(s.lastActivityAt) : "never"}
              {s.member.phone ? ` · ${s.member.phone}` : ""}
            </span>
          </span>
          <span className="text-xs text-black/50 dark:text-white/50">
            {s.notifiedAt ? `Facilitators told ${formatDate(s.notifiedAt)}` : "Facilitators not yet told"}
          </span>
        </li>
      ))}
    </ul>
  );
}
