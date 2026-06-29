"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Download, RefreshCw, ListFilter } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

interface HistoryRow {
  id: string;
  serviceName: string;
  date: string;
  status: "present" | "absent";
  mode: "onsite" | null;
}
interface HistoryResponse {
  member: { name: string; email: string | null; phone: string | null } | null;
  records: HistoryRow[];
}

type ColKey = "id" | "name" | "email" | "phone" | "service" | "date" | "status" | "mode";

/** Stable 4-digit display id from a uuid, so the ID column reads cleanly. */
function shortId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (id.charCodeAt(i) + ((h << 5) - h)) | 0;
  return String((Math.abs(h) % 9000) + 1000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyAttendanceClient() {
  const { data, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["attendance", "me", "history"],
    queryFn: async () => {
      const res = await apiClient.get<HistoryResponse>("/attendance/me/history");
      return res.data;
    },
  });

  const member = data?.member ?? null;
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Record<ColKey, string>>({
    id: "", name: "", email: "", phone: "", service: "", date: "", status: "", mode: "",
  });
  const setFilter = (k: ColKey, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const allRows = useMemo(() => {
    const recs = data?.records ?? [];
    return recs.map((r) => ({
      raw: r,
      id: shortId(r.id),
      name: member?.name ?? "—",
      email: member?.email ?? "—",
      phone: member?.phone ?? "—",
      service: r.serviceName,
      date: fmtDate(r.date),
      status: r.status,
      mode: r.mode ?? "--",
    }));
  }, [data, member]);

  const rows = useMemo(
    () =>
      allRows.filter((row) =>
        (Object.keys(filters) as ColKey[]).every((k) => {
          const q = filters[k].trim().toLowerCase();
          if (!q) return true;
          return String((row as Record<string, unknown>)[k] ?? "").toLowerCase().includes(q);
        }),
      ),
    [allRows, filters],
  );

  function exportCsv() {
    const header = ["ID", "Name", "Email", "Phone", "Service", "Date", "Status", "Mode"];
    const body = rows.map((r) => [r.id, r.name, r.email, r.phone, r.service, r.date, r.status, r.mode]);
    const csv = [header, ...body]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const COLS: { key: ColKey; label: string }[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "service", label: "Service" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "mode", label: "Mode" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Section label + heading */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#87102C] dark:text-[#FFB3C1]">
          Attendance
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#111] dark:text-white">
          My Attendance
        </h1>
        <p className="mt-1 text-sm text-[#555] dark:text-white/50 max-w-xl">
          Your personal attendance history across all church services. Track your
          overall participation.
        </p>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
            <SlidersHorizontal size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-[#111] dark:text-white">Filter</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/40">Filter attendance records</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          aria-pressed={showFilter}
          aria-label="Toggle filters"
          className={`relative h-6 w-12 rounded-full transition-colors ${
            showFilter ? "bg-[#87102C]" : "bg-[#E7CDD3] dark:bg-white/15"
          }`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${showFilter ? "left-6" : "left-0.5"}`} />
        </button>
      </div>

      {/* Meta + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">
          {rows.length} record{rows.length === 1 ? "" : "s"} found
        </p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-[#87102C]/25"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E7CDD3] dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-[#87102C] dark:text-white/70 transition-colors hover:bg-[#FFF4F6] dark:hover:bg-white/5"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table (elevated card) */}
      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-x-auto shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FFF4F6] dark:bg-white/[0.02] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-[#87102C]/70 dark:text-white/45 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
            {showFilter && (
              <tr className="bg-[#FFF4F6]/50 dark:bg-white/[0.02] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
                {COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2">
                    <div className="relative">
                      <input
                        value={filters[c.key]}
                        onChange={(e) => setFilter(c.key, e.target.value)}
                        aria-label={`Filter by ${c.label}`}
                        className="w-full rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 pl-2.5 pr-6 py-1.5 text-xs text-[#111] dark:text-white outline-none focus-visible:border-[#87102C] focus-visible:ring-2 focus-visible:ring-[#87102C]/15"
                      />
                      <ListFilter size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#b8a8ac] dark:text-white/30" />
                    </div>
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.05]">
            {isLoading ? (
              <tr><td colSpan={COLS.length} className="px-4 py-12 text-center text-sm text-[#8a7e80] dark:text-white/40">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS.length} className="px-4 py-12 text-center text-sm text-[#8a7e80] dark:text-white/40">No records found.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.raw.id}-${i}`} className="hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-[#8a7e80] dark:text-white/50 whitespace-nowrap">{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-[#111] dark:text-white whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.email === "—" ? (
                      <span className="text-[#b8a8ac] dark:text-white/30">—</span>
                    ) : (
                      <a href={`mailto:${r.email}`} className="text-[#87102C] dark:text-[#FFB3C1] hover:underline">{r.email}</a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#555] dark:text-white/60 whitespace-nowrap">{r.phone}</td>
                  <td className="px-4 py-3 text-[#555] dark:text-white/70 whitespace-nowrap">{r.service}</td>
                  <td className="px-4 py-3 text-[#555] dark:text-white/60 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      r.status === "present"
                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.mode === "--" ? (
                      <span className="text-[#b8a8ac] dark:text-white/30">--</span>
                    ) : (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
                        {r.mode}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
