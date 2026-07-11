"use client";

import { Pagination } from "@/components/ui/navigation/Pagination";
import type { VisitorRow } from "./FirstTimer/types";
import { useFirstTimersFilter } from "./FirstTimer/useFirstTimersFilter";
import PanelHeader from "./FirstTimer/PanelHeader";
import VisitorsTable from "./FirstTimer/VisitorsTable";
import EmptyState from "./FirstTimer/EmptyState";

export type { VisitorRow };

interface Props {
  visitors: VisitorRow[];
}

export default function FirstTimersClient({ visitors }: Props) {
  const {
    handleCreated,
    search,
    setSearch,
    filter,
    setFilter,
    filtered,
    pagedRows,
    page,
    pageCount,
    setPage,
    filterTabs,
    total,
  } = useFirstTimersFilter(visitors);

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">First Timers</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
          Review newcomer submissions and create member accounts.
        </p>
      </div>

      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <PanelHeader
          total={total}
          filterTabs={filterTabs}
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        {filtered.length === 0 ? (
          <EmptyState hasAny={total > 0} />
        ) : (
          <>
            <VisitorsTable rows={pagedRows} onCreated={handleCreated} />
            <div className="py-4 border-t border-[#E7CDD3]/40 dark:border-white/[0.07]">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
