"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Shield } from "lucide-react";
import { useAllReports, type ReportStatus } from "@/lib/api/status-reports";
import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";
import AuditReportCard from "./AuditReportCard";
import AuditReviewDrawer from "./AuditReviewDrawer";

const TABS: { label: string; value: ReportStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Needs Correction", value: "NEEDS_CORRECTION" },
  { label: "Approved", value: "APPROVED" },
];

function StatTile({ icon: Icon, count, label, cls }: { icon: typeof Clock; count: number; label: string; cls: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#161618]">
      <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.07] ${cls.split(" ")[0]}`} />
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>
        <Icon size={16} />
      </span>
      <p className="mt-3 text-2xl font-black tabular-nums leading-none text-gray-900 dark:text-white">{count}</p>
      <p className="mt-1 text-[11px] font-semibold text-gray-400 dark:text-white/40">{label}</p>
    </div>
  );
}

export default function AuditLogClient() {
  const [tab, setTab] = useState<ReportStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const q = useAllReports(tab || undefined);
  const all = useAllReports();
  const reports = q.data ?? [];
  // Look up from the unfiltered list so the drawer stays populated even if a
  // status change (e.g. approving) moves the report out of the active tab's filter.
  const selectedReport = (all.data ?? []).find((r) => r.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const rows = all.data ?? [];
    return {
      submitted: rows.filter((r) => r.status === "SUBMITTED").length,
      needsCorrection: rows.filter((r) => r.status === "NEEDS_CORRECTION").length,
      approved: rows.filter((r) => r.status === "APPROVED").length,
    };
  }, [all.data]);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#161618]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#87102C] via-[#c23a5b] to-[#87102C]/30" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
              <Shield size={19} className="text-[#87102C] dark:text-[#e8768a]" />
            </span>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
                Administration
              </p>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Audit Log</h1>
              <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-white/50">
                Status reports logged by Department Heads, Unit Leads, and Pastors — approve, request a correction, or comment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Clock} count={counts.submitted} label="Pending review" cls="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" />
        <StatTile icon={AlertTriangle} count={counts.needsCorrection} label="Needs correction" cls="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <StatTile icon={CheckCircle2} count={counts.approved} label="Approved" cls="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-gray-200 p-5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <SkeletonBlock className="h-8 w-8 rounded-full" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : q.isError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          Couldn&apos;t load reports.
        </p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-12 text-center dark:border-white/15 dark:bg-white/[0.02]">
          <Shield size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No reports yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Reports logged from My Department, My Unit, or a Pastor's dashboard will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r, i) => (
            <AuditReportCard key={r.id} report={r} index={i} onOpen={() => setSelectedId(r.id)} />
          ))}
        </div>
      )}

      <AuditReviewDrawer report={selectedReport} onClose={() => setSelectedId(null)} />
    </div>
  );
}
