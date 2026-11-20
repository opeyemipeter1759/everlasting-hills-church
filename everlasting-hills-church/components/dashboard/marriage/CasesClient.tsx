"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useCases } from "@/lib/api/premarital";
import { STATUS_LABEL, type CaseStatus } from "@/lib/pre-marital/schema";
import { PageHeader, QueryState, StatusBadge, coupleName, lagosDate, secondary, selectBox } from "./ui";

const STATUS_FILTER = [{ value: "", label: "Every status" }, ...(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))];

/** Every case this person may see, newest first, 25 at a time. */
export default function CasesClient() {
  const initial = useSearchParams().get("status") ?? "";
  const [status, setStatus] = useState(initial);
  const [cursors, setCursors] = useState<string[]>([]);
  const q = useCases({ status, cursor: cursors.at(-1) });
  const items = q.data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader title="Applications" subtitle="Open a case to review it, assign a counsellor and book sessions.">
        <div className="w-full sm:w-64">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setCursors([]);
            }}
            options={STATUS_FILTER}
            prefixLabel="Status"
            aria-label="Show cases by status"
            className={selectBox}
          />
        </div>
      </PageHeader>

      <QueryState isLoading={q.isLoading} error={q.error} />
      {q.data && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-white/15 dark:text-white/60">
          No applications here. New ones appear as soon as a couple applies on the website.
        </p>
      )}
      {items.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-white/[0.06] dark:border-white/10 dark:bg-[#161618]">
          {items.map((c) => {
            const lead = c.counsellors.find((x) => x.isLead)?.name;
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/marriage/applications/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:hover:bg-white/[0.03]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#111] dark:text-white">
                      <span className="truncate">{coupleName(c)}</span>
                      {c.safeguardingFlaggedAt && <ShieldAlert size={15} className="flex-shrink-0 text-red-600 dark:text-red-400" aria-label="Safeguarding concern raised" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-600 dark:text-white/55">
                      Applied {lagosDate(c.submittedAt)} · {c.referenceCode}
                      {lead ? ` · Counsellor: ${lead}` : ""}
                    </span>
                  </span>
                  <StatusBadge status={c.status} />
                  <ChevronRight size={16} aria-hidden="true" className="flex-shrink-0 text-gray-400 dark:text-white/40" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex justify-between gap-3">
        {cursors.length > 0 ? (
          <button type="button" className={secondary} onClick={() => setCursors((c) => c.slice(0, -1))}>
            Newer
          </button>
        ) : (
          <span />
        )}
        {q.data?.nextCursor && (
          <button type="button" className={secondary} onClick={() => setCursors((c) => [...c, q.data!.nextCursor!])}>
            Older
          </button>
        )}
      </div>
    </div>
  );
}
