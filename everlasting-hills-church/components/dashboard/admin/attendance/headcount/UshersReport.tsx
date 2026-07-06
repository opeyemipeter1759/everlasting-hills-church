"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, RefreshCw, Users, UserCheck } from "lucide-react";
import {
  useHeadcountByDate,
  useHeadcountHistory,
  useTodayHeadcount,
} from "@/lib/api/headcount";
import { useAdminStatsOverview } from "@/lib/api";
import HeadcountDatePicker from "./HeadcountDatePicker";
import HeadcountReportCard from "./HeadcountReportCard";
import { watTodayStr, inferType } from "./date-utils";

export default function UshersReport() {
  const [date, setDate] = useState<string>(watTodayStr());
  const byDate = useHeadcountByDate(date);
  const history = useHeadcountHistory(60);
  const today = useTodayHeadcount();
  const stats = useAdminStatsOverview();

  const selectedType = byDate.data?.inferredType ?? inferType(date);

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/admin/attendance"
            className="mt-0.5 rounded-lg p-2 text-gray-400 hover:bg-[#87102C]/5 hover:text-[#87102C]"
            aria-label="Back to attendance"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Ushers Attendance Report</h1>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Authoritative congregation headcount per service. Pick a date to see that day&apos;s report.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { byDate.refetch(); history.refetch(); today.refetch(); }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Dual signal */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Signal label="Today's headcount" hint="usher total" value={today.data?.total ?? "—"} icon={<Users size={14} />} tone="burgundy" loading={today.isLoading} />
        <Signal label="Today's check-ins" hint="individual app" value={stats.data?.todayPresent ?? 0} icon={<UserCheck size={14} />} tone="slate" loading={stats.isLoading} />
      </div>

      {/* Date picker + featured card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <HeadcountDatePicker value={date} onChange={setDate} />
        <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4">
          {byDate.isLoading ? (
            <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ) : (
            <HeadcountReportCard
              hc={byDate.data?.headcount ?? null}
              serviceName={byDate.data?.service?.name ?? null}
              serviceType={selectedType}
              serviceDate={date}
              featured
            />
          )}
        </div>
      </div>

      {/* All report cards */}
      <div>
        <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
          All reports
        </p>
        {history.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
          </div>
        ) : history.data && history.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {history.data.map((h) => (
              <HeadcountReportCard
                key={h.id}
                hc={h}
                serviceName={h.serviceName}
                serviceType={h.serviceType}
                serviceDate={h.serviceDate.slice(0, 10)}
                onClick={() => setDate(h.serviceDate.slice(0, 10))}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
            <ClipboardList size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
            <p className="text-sm font-semibold text-gray-700 dark:text-white/80">No reports yet</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
              Ushers record congregation headcounts from the Usher page. Reports will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Signal({
  label, hint, value, icon, tone, loading,
}: {
  label: string; hint: string; value: number | string; icon: React.ReactNode; tone: "burgundy" | "slate"; loading?: boolean;
}) {
  const toneCls = tone === "burgundy"
    ? "bg-[#87102C]/10 dark:bg-[#87102C]/15 text-[#87102C] dark:text-[#e8768a]"
    : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/60";
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4">
      <div className="mb-1 flex items-start justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneCls}`}>{icon}</span>
      </div>
      {loading ? (
        <div className="h-8 w-14 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
      ) : (
        <p className="text-3xl font-black tabular-nums leading-none text-gray-900 dark:text-white">{value}</p>
      )}
      <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">{hint}</p>
    </div>
  );
}
