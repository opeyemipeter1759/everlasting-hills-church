"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useMembersAtRisk } from "@/lib/api/members-at-risk";
import { usePagedList } from "@/components/ui/navigation/usePagedList";
import { PaginationFooter } from "@/components/ui/navigation/PaginationFooter";
import AtRiskRow from "./AtRiskRow";
import { REASONS, countByReason, filterRiskRows, shortDate, toRiskRows, type RiskReason } from "./at-risk-data";

const th = "px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/50 whitespace-nowrap";

/**
 * Members who need checking on, one row each, judged on the Sundays held
 * since they joined. It reads app check-ins, so someone who comes but never
 * checks in can appear here too.
 */
export default function AtRiskTable() {
  const { data, isLoading, isError } = useMembersAtRisk();
  const [reason, setReason] = useState<RiskReason | null>(null);
  const [search, setSearch] = useState("");
  const all = toRiskRows(data);
  const counts = countByReason(all);
  const paged = usePagedList(filterRiskRows(all, reason, search), { pageSize: 10, resetKey: `${reason}|${search}` });
  const win = data?.window;

  const tabs: { value: RiskReason | null; label: string; count: number }[] = [
    { value: null, label: "Everyone", count: all.length },
    ...(Object.keys(REASONS) as RiskReason[]).map((r) => ({ value: r, label: REASONS[r].label, count: counts[r] })),
  ];

  return (
    <section aria-labelledby="at-risk-title" className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1c1c1e]">
      <div className="space-y-4 border-b border-gray-100 px-5 py-4 dark:border-white/[0.08]">
        <div>
          <h2 id="at-risk-title" className="text-base font-black text-[#1A1210] dark:text-white">
            At-risk members{!isLoading && !isError && <span className="ml-2 font-semibold text-gray-500 dark:text-white/50">{all.length}</span>}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
            Active members who missed the last three Sundays, never checked in, or came to fewer than half
            {win?.from && win.to ? ` of the ${win.sundays} Sundays from ${shortDate(win.from)} to ${shortDate(win.to)}` : ""}. Based on app check-ins.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Show" className="inline-flex flex-wrap rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]">
            {tabs.map((t) => {
              const on = reason === t.value;
              return (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReason(t.value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    on ? "bg-white text-[#1A1210] shadow-sm dark:bg-[#2a2a2e] dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white/80"
                  }`}
                >
                  {t.label}
                  <span className={`tabular-nums ${on ? "text-[#87102C] dark:text-[#E8768A]" : ""}`}>{t.count}</span>
                </button>
              );
            })}
          </div>
          <label className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <span className="sr-only">Search by name</span>
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-2.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/70 dark:bg-white/[0.02]">
            <tr>
              <th scope="col" className={`${th} pl-5`}>Member</th>
              <th scope="col" className={`${th} hidden sm:table-cell`}>Why</th>
              <th scope="col" className={`${th} hidden md:table-cell`}>Last checked in</th>
              <th scope="col" className={`${th} hidden lg:table-cell`}>Last {win?.sundays ?? 8} Sundays</th>
              <th scope="col" className={`${th} pr-5 text-right`}><span className="sr-only">Contact</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-5 py-3"><div className="h-8 rounded-lg bg-gray-100 dark:bg-white/5" /></td>
                </tr>
              ))
            ) : paged.total === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500 dark:text-white/50">
                  {isError ? "This list couldn't load. Refresh to try again." : all.length === 0 ? "Nobody needs checking on right now." : "Nobody matches that search."}
                </td>
              </tr>
            ) : (
              paged.items.map((row) => <AtRiskRow key={row.userId} row={row} />)
            )}
          </tbody>
        </table>
      </div>

      {paged.total > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 dark:border-white/[0.08]">
          <PaginationFooter paged={paged} noun="members" pageSizeOptions={[10, 25, 50]} />
        </div>
      )}
    </section>
  );
}
