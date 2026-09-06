"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Pencil, Search } from "lucide-react";
import { useHeadcountHistory, type HeadcountHistoryRow } from "@/lib/api/headcount";
import { downloadCsv } from "@/lib/export-csv";
import { prettyDate } from "@/components/dashboard/admin/attendance/headcount/date-utils";

const TYPE_LABEL: Record<string, string> = {
  SUNDAY: "Sunday",
  WEDNESDAY: "Wednesday",
  SPECIAL: "Special",
};

type TypeFilter = "ALL" | "SUNDAY" | "WEDNESDAY" | "SPECIAL";

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SUNDAY", label: "Sunday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "SPECIAL", label: "Special" },
];

/** WAT calendar day of a service timestamp, for the edit deep-link. */
function watDate(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso.slice(0, 10);
  return new Date(at.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function HeadcountHistory() {
  const { data, isLoading, isError, error } = useHeadcountHistory(100);
  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      const matchType = filter === "ALL" || row.serviceType === filter;
      const matchQ = !q || row.serviceName.toLowerCase().includes(q) || row.serviceDate.includes(q);
      return matchType && matchQ;
    });
  }, [data, filter, search]);

  const totals = useMemo(
    () => ({
      services: rows.length,
      people: rows.reduce((sum, r) => sum + r.total, 0),
      firstTimers: rows.reduce((sum, r) => sum + r.firstTimers, 0),
    }),
    [rows],
  );

  function exportCsv() {
    downloadCsv(
      "headcounts",
      rows.map((r: HeadcountHistoryRow) => ({
        date: watDate(r.serviceDate),
        service: r.serviceName,
        type: r.serviceType,
        men: r.men,
        women: r.women,
        boys: r.boys,
        girls: r.girls,
        children: r.children,
        firstTimers: r.firstTimers,
        total: r.total,
        reportedTotal: r.reportedTotal,
        notes: r.notes,
      })),
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        Could not load the history — {(error as { message?: string })?.message ?? "please try again."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 dark:border-white/10 dark:bg-white/[0.04]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                filter === f.key
                  ? "bg-[#87102C] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white"
              }`}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a service"
              className="w-44 rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#87102C]/40 focus:outline-none focus:ring-2 focus:ring-[#87102C]/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* Totals for whatever is on screen, so a filtered view still adds up. */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Services", value: totals.services },
          { label: "People counted", value: totals.people },
          { label: "First-timers", value: totals.firstTimers },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/35">
              {stat.label}
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-gray-900 dark:text-white">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 dark:border-white/10 dark:text-white/40">
          {search || filter !== "ALL"
            ? "No headcounts match that."
            : "No headcounts recorded yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 dark:bg-white/[0.03] dark:text-white/35">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Service</th>
                <th className="px-3 py-3 text-right font-bold">Men</th>
                <th className="px-3 py-3 text-right font-bold">Women</th>
                <th className="px-3 py-3 text-right font-bold">Children</th>
                <th className="px-3 py-3 text-right font-bold">First-timers</th>
                <th className="px-3 py-3 text-right font-bold">Total</th>
                <th className="px-4 py-3 text-right font-bold" aria-label="Edit" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-white/[0.06] dark:bg-[#161618]">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{row.serviceName}</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      {prettyDate(watDate(row.serviceDate))} ·{" "}
                      {TYPE_LABEL[row.serviceType] ?? row.serviceType}
                      {row.edited && " · edited"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-white/60">{row.men}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-white/60">{row.women}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-white/60">{row.children}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-white/60">
                    {row.firstTimers}
                  </td>
                  <td className="px-3 py-3 text-right text-base font-black tabular-nums text-gray-900 dark:text-white">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/usher?date=${watDate(row.serviceDate)}`}
                      title="Edit this count"
                      aria-label={`Edit the count for ${row.serviceName}`}
                      className="inline-flex rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#87102C] dark:hover:bg-white/5 dark:hover:text-[#e8768a]"
                    >
                      <Pencil size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
