"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadAttendanceCsv, useAttendanceList, useOverrideAttendance, type AttendanceRow, type OverviewService } from "@/lib/api/attendance-roll";
import { PaginationFooter } from "@/components/ui/navigation/PaginationFooter";
import { showToast } from "@/components/ui/toast/toast";
import RollFilters, { type RollFilterValues } from "./RollFilters";
import RollTable from "./RollTable";
import BulkMarkBar from "./BulkMarkBar";
import { isOneService, rollQuery, scopeOptions, type RollSortCol, type RollState } from "./roll-query";

type Filters = Omit<RollState, "scope" | "page" | "limit" | "sort">;
const NO_FILTERS: Filters = { status: undefined, gender: undefined, name: "" };

/**
 * Who checked in, member by member. The service comes from the page so the
 * overview above and this roll always show the same one.
 */
export default function AttendanceRoll({ scope, onScopeChange, services }: { scope: string; onScopeChange: (scope: string) => void; services: OverviewService[] }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [name, setName] = useState("");
  const [sort, setSort] = useState<RollState["sort"]>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overridingId, setOverridingId] = useState<string | null>(null);
  const top = useRef<HTMLElement>(null);

  // Typing settles for a moment before the list is asked again.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.name === name ? f : { ...f, name }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [name]);

  // A new service from the overview starts the roll again from the top.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [scope]);

  const query = rollQuery({ scope, ...filters, sort, page, limit });
  const { data, isLoading, isFetching } = useAttendanceList(query);
  const override = useOverrideAttendance();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  // A row can leave the last page (marked present under "Absent"); step back rather than show an empty page.
  useEffect(() => {
    if (meta && meta.totalPages > 0 && page > meta.totalPages) setPage(meta.totalPages);
  }, [meta, page]);

  function changeFilters(patch: Partial<RollFilterValues>) {
    const { scope: nextScope, name: nextName, ...rest } = patch;
    if (nextScope !== undefined) onScopeChange(nextScope);
    if (nextName !== undefined) setName(nextName);
    if (Object.keys(rest).length) {
      setFilters((f) => ({ ...f, ...rest }));
      setPage(1);
      setSelected(new Set());
    }
  }

  function goTo(p: number) {
    setPage(p);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function sortBy(col: RollSortCol) {
    setSort((s) => ({ col, dir: s?.col === col && s.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  }

  async function toggleStatus(row: AttendanceRow) {
    const next = row.status === "PRESENT" ? "ABSENT" : "PRESENT";
    setOverridingId(row.id);
    try {
      await override.mutateAsync({ sessionId: row.sessionId, userId: row.userId, status: next });
      showToast.success(`${row.userName} marked ${next === "PRESENT" ? "present" : "absent"}`);
    } catch {
      showToast.error(`Couldn't update ${row.userName}. Please try again.`);
    } finally {
      setOverridingId(null);
    }
  }

  return (
    <section id="attendance-roll" ref={top} className="scroll-mt-20 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1c1c1e]">
      <div className="space-y-4 border-b border-gray-100 px-5 py-4 dark:border-white/[0.08]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#1A1210] dark:text-white">Who checked in</h2>
            <p className="text-xs text-gray-500 dark:text-white/50">Members who checked in on the app and those who didn&apos;t. Deactivated members aren&apos;t listed.</p>
          </div>
          <button
            type="button"
            onClick={() => downloadAttendanceCsv({ ...query, page: undefined, limit: undefined })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Download size={12} /> Export
          </button>
        </div>
        <RollFilters
          values={{ scope, gender: filters.gender, status: filters.status, name }}
          scopeOptions={scopeOptions(services)}
          counts={meta ? { present: meta.presentCount, absent: meta.absentCount } : null}
          onChange={changeFilters}
          onClear={() => { setName(""); setFilters(NO_FILTERS); setPage(1); }}
        />
        {selected.size > 0 && <BulkMarkBar rows={rows.filter((r) => selected.has(r.id))} onDone={() => setSelected(new Set())} />}
      </div>

      <div className="relative overflow-x-auto">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-10 dark:bg-[#1c1c1e]/50">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow dark:border-white/10 dark:bg-[#2a2a2e] dark:text-gray-400">
              <Loader2 size={12} className="animate-spin text-[#87102C]" /> Updating
            </span>
          </div>
        )}
        <RollTable
          rows={rows}
          loading={isLoading}
          oneService={isOneService(scope)}
          sort={sort}
          onSort={sortBy}
          selected={selected}
          onToggle={(id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; })}
          onToggleAll={() => setSelected(rows.length > 0 && rows.every((r) => selected.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id)))}
          overridingId={overridingId}
          onOverride={toggleStatus}
        />
      </div>

      {meta && meta.total > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 dark:border-white/[0.08]">
          <PaginationFooter
            noun={isOneService(scope) ? "members" : "records"}
            pageSizeOptions={[20, 50, 100]}
            paged={{ page: meta.page, pageSize: meta.limit, pageCount: meta.totalPages, total: meta.total, setPage: goTo, setPageSize: (n) => { setLimit(n); setPage(1); } }}
          />
        </div>
      )}
    </section>
  );
}
