"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { usePipeline, type PipelineStatus } from "@/lib/api/pipeline";
import { PeopleTable } from "../PeopleTable";
import { CameAgainButton } from "../visits/CameAgainButton";
import { RowAnswers } from "./RowAnswers";
import { StatusFilterChips } from "./StatusFilterChips";

const PAGE_SIZE = 25;

/**
 * The month's people: status chips that filter, search by name or phone, and
 * a table (cards on a phone), paged on the server. Rows open to every
 * non-pastoral answer and link to the full profile.
 */
export function MonthPeople({
  year,
  month,
  status,
  onStatus,
}: {
  year: number;
  month: number;
  status: PipelineStatus | "";
  onStatus: (status: PipelineStatus | "") => void;
}) {
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(timer);
  }, [typed]);
  useEffect(() => setPage(1), [search, status]);

  const query = usePipeline({ year, month, status, search, sort: "name", take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE });
  const total = query.data?.total ?? 0;

  return (
    <section className="space-y-3" aria-label="People">
      <StatusFilterChips counts={query.data?.counts} value={status} onChange={onStatus} />
      <label className="relative block">
        <span className="sr-only">Search by name or phone</span>
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Search by name or phone"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        />
      </label>
      <PeopleTable
        rows={query.data?.rows ?? []}
        loading={query.isLoading}
        profileHref={(row) => `/dashboard/follow-up/person/${row.visitorId}`}
        renderExpanded={(row) => <RowAnswers visitorId={row.visitorId} />}
        renderActions={(row) => <CameAgainButton visitorId={row.visitorId} firstName={row.firstName} firstVisitDate={row.firstVisitDate} />}
        empty={search ? "Nobody this month matches that search." : "Nobody here yet."}
      />
      {total > 0 && (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-white/45">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}
