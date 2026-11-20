"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useCase } from "@/lib/api/premarital";
import { QueryState, StatusBadge, card, coupleName, lagosDate } from "../ui";
import { AdminPanel } from "./AdminPanel";
import { CounsellorsPanel } from "./CounsellorsPanel";
import { PeoplePanel } from "./PeoplePanel";
import { ProgressPanel } from "./ProgressPanel";
import { SessionsPanel } from "./SessionsPanel";
import { StatusPanel } from "./StatusPanel";
import { Timeline } from "./Timeline";

/** One case: who they are, where it stands, the counsellors, sessions and progress. Opening it is recorded. */
export default function CaseClient({ id }: { id: string }) {
  const q = useCase(id);
  const c = q.data;
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <Link href="/dashboard/marriage/applications" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#111] dark:text-white/65 dark:hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" /> All applications
      </Link>
      <QueryState isLoading={q.isLoading} error={q.error} />
      {c && (
        <>
          <header className={`${card} flex flex-wrap items-start justify-between gap-3`}>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#111] dark:text-white">{coupleName(c)}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                {c.referenceCode} · Applied {lagosDate(c.submittedAt)}
                {c.weddingDate ? ` · Wedding planned for ${lagosDate(c.weddingDate)}` : ""}
              </p>
            </div>
            <StatusBadge status={c.status} />
          </header>
          {c.safeguardingFlaggedAt && (
            <p role="status" className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-200">
              <ShieldAlert size={18} aria-hidden="true" /> A safeguarding concern has been raised. Only the pastors can see this case.
            </p>
          )}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-4">
              <StatusPanel c={c} />
              <PeoplePanel c={c} />
              <SessionsPanel c={c} />
              <ProgressPanel c={c} />
            </div>
            <div className="min-w-0 space-y-4">
              <CounsellorsPanel c={c} />
              <AdminPanel c={c} />
              <Timeline c={c} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
