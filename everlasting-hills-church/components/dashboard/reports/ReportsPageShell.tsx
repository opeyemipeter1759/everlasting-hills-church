"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, FileText, Layers, Plus, type LucideIcon } from "lucide-react";
import { useMyReports, type ReportScope } from "@/lib/api/status-reports";
import ReportCard from "./ReportCard";
import ReportsListSkeleton from "@/components/ui/skeleton/ReportsListSkeleton";

interface Target {
  id: string;
  name: string;
}

function StatTile({ icon: Icon, count, label, tone }: { icon: LucideIcon; count: number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={16} />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{count}</p>
      <p className="text-xs font-semibold text-gray-400 dark:text-white/40">{label}</p>
    </div>
  );
}

/** "Reports" list page — Total/Drafted/Sent/Approved/Rejected stat tiles, an
 * optional department/unit switcher, and each report as a row. Create and
 * view/edit live on their own routes (see ReportEditorPage) — this page never
 * composes or opens a report inline. Shared by the Department, Unit, and
 * Pastoral report sections. */
export default function ReportsPageShell({
  scope,
  targets = [],
  icon: HeaderIcon,
  title,
  subtitle,
  basePath,
}: {
  scope: ReportScope;
  /** Department(s)/unit this page covers. Empty for scope="PASTOR". */
  targets?: Target[];
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** e.g. "/dashboard/unit-lead/reports" — "New report" and each row's View link build off this. */
  basePath: string;
}) {
  const router = useRouter();
  const q = useMyReports();
  const [activeTargetId, setActiveTargetId] = useState<string | undefined>(targets[0]?.id);

  const activeTarget = targets.find((t) => t.id === activeTargetId) ?? targets[0];

  const reports = useMemo(() => {
    return (q.data ?? []).filter((r) => {
      if (scope === "DEPARTMENT") return r.department?.id === activeTarget?.id;
      if (scope === "UNIT") return r.unit?.id === activeTarget?.id;
      return r.scope === "PASTOR";
    });
  }, [q.data, scope, activeTarget]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      drafted: reports.filter((r) => r.status === "DRAFT").length,
      sent: reports.filter((r) => r.status === "SUBMITTED").length,
      approved: reports.filter((r) => r.status === "APPROVED").length,
      rejected: reports.filter((r) => r.status === "NEEDS_CORRECTION").length,
    }),
    [reports],
  );

  if (q.isLoading) {
    return <ReportsListSkeleton withTargetPills={targets.length > 1} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
            <HeaderIcon size={16} className="text-[#87102C] dark:text-[#e8768a]" />
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-0.5 max-w-lg text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`${basePath}/new`)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24]"
        >
          <Plus size={15} /> New report
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile icon={Layers} count={stats.total} label="Total" tone="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50" />
        <StatTile icon={FileText} count={stats.drafted} label="Drafted" tone="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50" />
        <StatTile icon={Clock} count={stats.sent} label="Sent" tone="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" />
        <StatTile icon={CheckCircle2} count={stats.approved} label="Approved" tone="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatTile icon={AlertTriangle} count={stats.rejected} label="Rejected" tone="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Target switcher — only shown when heading more than one department/unit */}
      {targets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {targets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTargetId(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTargetId === t.id
                  ? "bg-[#87102C] text-white"
                  : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-[#87102C]/30"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
          {reports.length > 0 ? `${reports.length} report${reports.length === 1 ? "" : "s"}` : "History"}
        </h2>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-12 text-center">
            <FileText size={24} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
            <p className="text-sm font-semibold text-gray-500 dark:text-white/50">No reports yet</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/30">New report above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r, i) => (
              <ReportCard key={r.id} report={r} index={i} viewHref={`${basePath}/${r.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
