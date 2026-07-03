"use client";

import { useMemo, useState } from "react";
import { ClipboardList, UserCheck, Users, ChevronDown, AlertTriangle, Radio } from "lucide-react";
import {
  useAttendanceServices,
  useHeadcountHistory,
  useServiceHeadcount,
  useTodayHeadcount,
  type ServiceTypeKey,
} from "@/lib/api/headcount";
import { useSessionBanner, useAdminStatsOverview } from "@/lib/api";
import HeadcountEntryForm from "./HeadcountEntryForm";

const TYPE_LABEL: Record<ServiceTypeKey, string> = {
  SUNDAY: "Sunday",
  WEDNESDAY: "Wednesday",
  SPECIAL: "Special",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function HeadcountSection() {
  const banner = useSessionBanner();
  const services = useAttendanceServices();
  const today = useTodayHeadcount();
  const stats = useAdminStatsOverview();
  const history = useHeadcountHistory(30);

  // Target service to count: the live session if one is open, otherwise the most
  // recent service.
  const liveId = banner.data?.hasActiveSession ? banner.data.session?.id : null;
  const targetId = liveId ?? services.data?.[0]?.id ?? null;

  const target = useServiceHeadcount(targetId);
  const [open, setOpen] = useState(true);

  const todayHeadcount = today.data?.total;
  const todayCheckIns = stats.data?.todayPresent ?? 0;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
            <Users size={16} className="text-[#87102C] dark:text-[#e8768a]" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-gray-900 dark:text-white">Congregation headcount</h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40 max-w-md">
              The authoritative usher count — total bodies in the room. This is the true measure of
              attendance and drives growth analytics. Separate from individual app check-ins.
            </p>
          </div>
        </div>
      </div>

      {/* Dual signal, clearly labelled so 1 check-in is never mistaken for 1 person present */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <SignalCard
          label="Today's headcount"
          hint="usher total · everyone present"
          value={todayHeadcount ?? "—"}
          icon={<Users size={14} />}
          tone="burgundy"
          loading={today.isLoading}
        />
        <SignalCard
          label="Today's check-ins"
          hint="individual · app users only"
          value={todayCheckIns}
          icon={<UserCheck size={14} />}
          tone="slate"
          loading={stats.isLoading}
        />
      </div>

      {/* Entry-point for the current/most-recent service */}
      {target.data && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {target.data.service.state === "LIVE" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Radio size={10} className="animate-pulse" /> Live
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {target.data.service.name}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-white/40">
                  {TYPE_LABEL[target.data.service.serviceType]} · {fmtDate(target.data.service.scheduledAt)}
                  {target.data.headcount ? ` · ${target.data.headcount.total} counted` : " · not counted yet"}
                </p>
              </div>
            </div>
            <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4">
              <HeadcountEntryForm
                serviceId={target.data.service.id}
                serviceName={target.data.service.name}
                state={target.data.service.state}
                canRecord={target.data.canRecord}
                existing={target.data.headcount}
                onSaved={() => {
                  target.refetch();
                  today.refetch();
                  history.refetch();
                }}
              />
            </div>
          )}
        </div>
      )}

      {!target.isLoading && !target.data && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center">
          <ClipboardList size={22} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
          <p className="text-sm font-semibold text-gray-700 dark:text-white/80">No service to count yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-white/40">Create a service session, then record its headcount here.</p>
        </div>
      )}

      {/* History */}
      <div className="mt-6">
        <p className="mb-2.5 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
          Headcount history
        </p>
        {history.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : history.data && history.data.length > 0 ? (
          <ul className="space-y-2">
            {history.data.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {h.serviceName}
                    {h.status === "DRAFT" && (
                      <span className="ml-2 rounded bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Draft
                      </span>
                    )}
                    {h.edited && <span className="ml-2 text-[10px] font-semibold text-gray-400">edited</span>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400 dark:text-white/40">
                    <span>{TYPE_LABEL[h.serviceType]} · {fmtDate(h.serviceDate)}</span>
                    <span className="text-gray-300 dark:text-white/20">|</span>
                    <span>M {h.men} · W {h.women} · Ch {h.children} · FT {h.firstTimers}</span>
                    {h.variance && (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={10} /> reported {h.variance.reportedTotal}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tabular-nums text-[#87102C] dark:text-white leading-none">{h.total}</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/40">present</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-white/80">No headcounts recorded yet</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
              Record the first congregation count above to start the growth trend.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function SignalCard({
  label,
  hint,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  hint: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "burgundy" | "slate";
  loading?: boolean;
}) {
  const toneCls =
    tone === "burgundy"
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
