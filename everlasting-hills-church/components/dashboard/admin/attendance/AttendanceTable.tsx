"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Search, ChevronUp, ChevronDown, Check, X, Download, Loader2 } from "lucide-react";
import { useAttendanceList, useOverrideAttendance, useBulkMarkAttendance, downloadAttendanceCsv, type AttendanceListQuery } from "@/lib/api";
import { showToast } from "@/components/ui/toast/toast";
import { SingleDatePicker } from "@/components/ui/form/DatePicker";
import { Select } from "@/components/ui/select";

type Col = "name" | "service" | "date" | "markedBy" | "status";

export function AttendanceTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"PRESENT" | "ABSENT" | undefined>();
  const [serviceKey, setServiceKey] = useState<string | undefined>();
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [sort, setSort] = useState<{ col: Col; dir: "asc" | "desc" }>({ col: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [overridingId, setOverridingId] = useState<string | null>(null);

  const query: AttendanceListQuery = {
    page, limit: 20,
    ...(q ? { name: q } : {}),
    ...(status ? { status } : {}),
    ...(serviceKey ? { serviceKey } : {}),
    ...(dateFilter ? { date: format(dateFilter, "yyyy-MM-dd") } : {}),
    sortBy: sort.col === "date" ? "date" : sort.col === "status" ? "status" : sort.col === "markedBy" ? "markedAt" : "name",
    sortOrder: sort.dir.toUpperCase() as "ASC" | "DESC",
  };

  const { data, isLoading, isFetching } = useAttendanceList(query);
  const override = useOverrideAttendance();
  const bulkMark = useBulkMarkAttendance();

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const pages = meta?.totalPages ?? 1;
  const allSel = rows.length > 0 && rows.every((r) => sel.has(r.id));

  const doSort = (col: Col) => { setSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" })); setPage(1); };
  const toggleRow = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(allSel ? new Set() : new Set(rows.map((r) => r.id)));

  async function doOverride(rowId: string, sessionId: string, userId: string, newStatus: "PRESENT" | "ABSENT") {
    setOverridingId(rowId);
    try {
      await override.mutateAsync({ sessionId, userId, status: newStatus });
      showToast.success(`Marked as ${newStatus === "PRESENT" ? "Present" : "Absent"}`);
    } catch (err) {
      console.error("Override failed", err);
      showToast.error("Failed to update attendance. Please try again.");
    } finally {
      // Small delay so the spinner stays visible even when the network is very fast
      setTimeout(() => setOverridingId(null), 400);
    }
  }

  async function doBulk(targetStatus: "PRESENT" | "ABSENT") {
    const selected = rows.filter((r) => sel.has(r.id));
    const grouped = selected.reduce<Record<string, string[]>>((acc, r) => {
      acc[r.sessionId] = [...(acc[r.sessionId] ?? []), r.userId];
      return acc;
    }, {});
    for (const [sessionId, userIds] of Object.entries(grouped)) {
      await bulkMark.mutateAsync({ sessionId, userIds, status: targetStatus });
    }
    setSel(new Set());
  }

  function TH({ col, label }: { col: Col; label: string }) {
    const active = sort.col === col;
    return (
      <th onClick={() => doSort(col)} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-white select-none whitespace-nowrap">
        <span className="inline-flex items-center gap-1">{label}{active && (sort.dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}</span>
      </th>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search member…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#87102C]/25" />
        </div>
        <Select aria-label="Filter by status" value={status ?? ""} onChange={(v) => { setStatus((v as "PRESENT" | "ABSENT") || undefined); setPage(1); }}
          className="text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-2 outline-none"
          options={[
            { value: "", label: "All Status" },
            { value: "PRESENT", label: "Present" },
            { value: "ABSENT", label: "Absent" },
          ]}
        />
        <Select aria-label="Filter by service" value={serviceKey ?? ""} onChange={(v) => { setServiceKey(v || undefined); setPage(1); }}
          className="text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-2 outline-none"
          options={[
            { value: "", label: "All Services" },
            { value: "sunday", label: "Sunday" },
            { value: "wednesday", label: "Wednesday" },
          ]}
        />
        <SingleDatePicker
          value={dateFilter}
          onChange={(d) => { setDateFilter(d); setPage(1); }}
          placeholder="Filter by date"
        />
        <div className="ml-auto flex items-center gap-2">
          {sel.size > 0 && (
            <>
              <span className="text-xs text-gray-400">{sel.size} selected</span>
              <button type="button" onClick={() => doBulk("PRESENT")} disabled={bulkMark.isPending} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors">Present</button>
              <button type="button" onClick={() => doBulk("ABSENT")} disabled={bulkMark.isPending} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors">Absent</button>
            </>
          )}
          <button type="button" onClick={() => downloadAttendanceCsv(query)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Download size={12} /> Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        {/* Refetch overlay — shows old data dimmed with a spinner while filters are applied */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-[#1c1c1e]/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#2a2a2e] border border-gray-200 dark:border-white/10 shadow text-xs font-semibold text-gray-500 dark:text-gray-400">
              <Loader2 size={12} className="animate-spin text-[#87102C]" />
              Filtering…
            </div>
          </div>
        )}
        <table className="w-full">
          <thead className="bg-gray-50/70 dark:bg-white/[0.02]">
            <tr>
              <th scope="col" aria-label="Select all" className="pl-5 py-3"><input type="checkbox" checked={allSel} onChange={toggleAll} className="rounded accent-[#87102C]" /></th>
              <TH col="name" label="Member" />
              <TH col="service" label="Service" />
              <TH col="date" label="Date" />
              <TH col="markedBy" label="Marked By" />
              <TH col="status" label="Status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/8">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="pl-5 py-3"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                  {[140, 100, 80, 70, 60].map((w, j) => (
                    <td key={j} className="px-4 py-3"><div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-[${w}px]`} /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No records found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                <td className="pl-5 py-3"><input type="checkbox" checked={sel.has(row.id)} onChange={() => toggleRow(row.id)} className="rounded accent-[#87102C]" /></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    {row.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.photoUrl} alt={row.userName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center shrink-0 text-[11px] font-black text-[#87102C] dark:text-[#e8768a] uppercase">{row.userName.charAt(0)}</div>
                    )}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.userName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.serviceName}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(row.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{row.markedBy}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => doOverride(row.id, row.sessionId, row.userId, row.status === "PRESENT" ? "ABSENT" : "PRESENT")}
                    disabled={overridingId === row.id}
                    title="Click to toggle"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors disabled:opacity-70 ${
                      row.status === "PRESENT"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100"
                    }`}>
                    {overridingId === row.id
                      ? <Loader2 size={10} className="animate-spin" />
                      : row.status === "PRESENT" ? <Check size={10} /> : <X size={10} />
                    }
                    {overridingId === row.id ? "Saving…" : row.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/8">
          <p className="text-xs text-gray-400">Page {page} of {pages} · {meta?.total ?? 0} records</p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
              <button type="button" key={p} onClick={() => setPage(p)} className={`w-7 h-7 text-xs rounded-lg font-bold transition-colors ${p === page ? "bg-[#87102C] text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"}`}>{p}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
