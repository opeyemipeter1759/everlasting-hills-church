"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  Download,
  RefreshCw,
  ListFilter,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { Pagination } from "@/components/ui/navigation/Pagination";

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<ColKey, string>>({
    id: "", name: "", email: "", phone: "", service: "", date: "", status: "", mode: "",
  });
  const setFilter = (k: ColKey, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

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

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [rows, safePage],
  );

  const stats = useMemo(() => {
    const total = allRows.length;
    const present = allRows.filter((r) => r.status === "present").length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, rate };
  }, [allRows]);

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
    <div className="max-w-6xl mx-auto px-6 md:px-4   space-y-5">
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

      {/* Stat summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={CalendarCheck} label="Total Services" value={stats.total} tone="rose" />
        <StatChip icon={CheckCircle2} label="Present" value={stats.present} tone="emerald" />
        <StatChip icon={XCircle} label="Absent" value={stats.absent} tone="red" />
        <StatChip icon={TrendingUp} label="Attendance Rate" value={`${stats.rate}%`} tone="sky" />
      </div>

      {/* Meta + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            aria-pressed={showFilter}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
              showFilter
                ? "bg-[#87102C] text-white"
                : "bg-[#FFF4F6] dark:bg-white/5 text-[#87102C] dark:text-[#FFB3C1] hover:bg-[#FFE8ED] dark:hover:bg-white/10"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filter
          </button>
          <p className="text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">
            {rows.length} record{rows.length === 1 ? "" : "s"} found
          </p>
        </div>
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
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#FFF4F6] dark:bg-[#140b10] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
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
              <tr className="bg-[#FFF4F6]/50 dark:bg-[#140b10] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
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
              <SkeletonRows cols={COLS.length} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4F6] dark:bg-white/5">
                      <CalendarCheck size={18} className="text-[#87102C]/50 dark:text-white/30" />
                    </span>
                    <p className="text-sm font-semibold text-[#111] dark:text-white">No records found</p>
                    <p className="text-xs text-[#8a7e80] dark:text-white/40">
                      Try adjusting or clearing your filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedRows.map((r, i) => (
                <tr
                  key={`${r.raw.id}-${i}`}
                  className={`transition-colors hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] ${
                    i % 2 === 1 ? "bg-[#FFFBFC] dark:bg-white/[0.012]" : ""
                  }`}
                >
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
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      r.status === "present"
                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                    }`}>
                      {r.status === "present" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
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

      <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}

const STAT_TONES = {
  rose: "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]",
  emerald: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  sky: "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
} as const;

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone: keyof typeof STAT_TONES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] px-4 py-3.5">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-[#111] dark:text-white tabular-nums">{value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#8a7e80] dark:text-white/40 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3 animate-pulse rounded bg-[#F0DCE1] dark:bg-white/[0.06]"
                style={{ width: `${50 + ((i + j) % 4) * 10}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
