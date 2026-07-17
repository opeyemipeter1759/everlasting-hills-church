"use client";

import { useState } from "react";
import { RefreshCw, Shield } from "lucide-react";
import { useAllReports, type ReportStatus } from "@/lib/api/status-reports";
import AuditReportItem from "./AuditReportItem";

const TABS: { label: string; value: ReportStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Needs Correction", value: "NEEDS_CORRECTION" },
  { label: "Approved", value: "APPROVED" },
];

export default function AuditLogClient() {
  const [tab, setTab] = useState<ReportStatus | "">("");
  const q = useAllReports(tab || undefined);
  const reports = q.data ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            Status reports logged by Department Heads and Unit Leads — approve, request a correction, or comment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              tab === t.value
                ? "bg-[#87102C] text-white"
                : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-[#87102C]/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />)}
        </div>
      ) : q.isError ? (
        <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
          Couldn&apos;t load reports.
        </p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-12 text-center">
          <Shield size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No reports yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Reports logged from My Department / My Unit will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => <AuditReportItem key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}
