"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { Wifi, RefreshCw, Users, CheckCircle2, Calendar } from "lucide-react";

interface OnlineCheckIn {
  id: string;
  email: string;
  name: string;
  channel: string;
  stage: string;
  visitCount: number;
  lastCheckedIn: string;
}

interface ListResponse {
  data: OnlineCheckIn[];
  meta: { total: number; take: number; skip: number };
}

const STAGE_LABELS: Record<string, string> = {
  SECOND_TIMER: "2nd Visit",
  RETURNING: "Returning",
};

const STAGE_CLASSES: Record<string, string> = {
  SECOND_TIMER: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  RETURNING:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function OnlineAudiencePage() {
  const [stageFilter, setStageFilter] = useState("");

  const q = useQuery({
    queryKey: ["online-audience", stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ take: "200", skip: "0" });
      if (stageFilter) params.set("stage", stageFilter);
      const { data } = await apiClient.get<ListResponse>(`/online-attendance?${params}`);
      return data;
    },
  });

  const records = q.data?.data ?? [];
  const total = q.data?.meta.total ?? 0;
  const secondTimers = records.filter((r) => r.stage === "SECOND_TIMER").length;
  const returning = records.filter((r) => r.stage !== "SECOND_TIMER").length;

  const stages = [
    { value: "", label: "All" },
    { value: "SECOND_TIMER", label: "2nd Visit" },
    { value: "RETURNING", label: "Returning" },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Online Audience</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            Track visitors who check in via the online attendance link.
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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Check-ins", value: total, icon: Users, color: "text-[#87102C] dark:text-[#e8768a]", bg: "bg-[#87102C]/10 dark:bg-[#87102C]/20" },
          { label: "2nd Visit", value: secondTimers, icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Returning", value: returning, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((card) => (
          <div key={card.label} className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                {q.isLoading ? "—" : card.value}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-white/40">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stage filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Wifi size={14} className="text-gray-400" />
        {stages.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStageFilter(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              stageFilter === s.value
                ? "bg-[#87102C] text-white"
                : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-[#87102C]/30 hover:text-[#87102C]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        {q.isLoading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5">
              <Wifi size={24} className="text-gray-300 dark:text-white/20" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-white/40">No check-ins yet</p>
            <p className="text-xs text-gray-400 dark:text-white/30">
              Online visitors who submit their email will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  {["Name", "Email", "Stage", "Visit #", "Channel", "Last Check-in"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-white/30">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {records.map((r) => (
                  <tr key={r.id} className="group transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">{r.name || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-white/50">{r.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STAGE_CLASSES[r.stage] ?? "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50"}`}>
                        {STAGE_LABELS[r.stage] ?? r.stage}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums font-bold text-gray-700 dark:text-white/70">{r.visitCount}</td>
                    <td className="px-5 py-3.5 text-gray-400 dark:text-white/40 uppercase text-[11px] font-semibold">{r.channel}</td>
                    <td className="px-5 py-3.5 text-gray-400 dark:text-white/40">
                      {fmt(r.lastCheckedIn)} <span className="text-[11px]">{fmtTime(r.lastCheckedIn)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!q.isLoading && records.length > 0 && (
          <div className="border-t border-gray-100 dark:border-white/[0.06] px-5 py-3">
            <p className="text-xs text-gray-400 dark:text-white/30">
              Showing {records.length} of {total} check-in{total !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
