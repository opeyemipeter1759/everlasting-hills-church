"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { Wifi, Users, Clock, Star } from "lucide-react";

interface OnlineRecord {
  id: string;
  email: string;
  name: string | null;
  channel: string;
  stage: string;
  visitCount: number;
  lastCheckedIn: string;
}

interface ListResponse {
  data: OnlineRecord[];
  meta: { total: number; take: number; skip: number };
}

const STAGE_LABELS: Record<string, string> = {
  FIRST_TIMER: "First Timer",
  SECOND_TIMER: "Second Timer",
  ONLINE_MEMBER: "Online Member",
};

const STAGE_CLASS: Record<string, string> = {
  FIRST_TIMER: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  SECOND_TIMER: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  ONLINE_MEMBER: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
};

export default function OnlineAudiencePage() {
  const [stageFilter, setStageFilter] = useState("");

  const { data, isLoading, isError } = useQuery<ListResponse>({
    queryKey: ["online-audience", stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ take: "100", skip: "0" });
      if (stageFilter) params.set("stage", stageFilter);
      const { data: res } = await apiClient.get<ListResponse>(`/online-attendance?${params}`);
      return res;
    },
  });

  const records = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const secondTimers = records.filter((r) => r.stage === "SECOND_TIMER").length;
  const onlineMembers = records.filter((r) => r.stage === "ONLINE_MEMBER").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Online Audience</h1>
        <p className="text-white/45 text-sm mt-1">Visitors who have checked in online</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Check-ins", value: total, icon: <Wifi size={18} />, color: "text-church-accent" },
          { label: "Second Timers", value: secondTimers, icon: <Clock size={18} />, color: "text-amber-400" },
          { label: "Online Members", value: onlineMembers, icon: <Star size={18} />, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className={`mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-white text-2xl font-bold">{s.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "FIRST_TIMER", "SECOND_TIMER", "ONLINE_MEMBER"].map((stage) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              stageFilter === stage
                ? "bg-church-maroon text-white"
                : "border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {stage ? STAGE_LABELS[stage] : "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-white/30 text-sm">Loading…</div>
        ) : isError ? (
          <div className="py-16 text-center text-red-400 text-sm">Failed to load records.</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">No records yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/35 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Name / Email</th>
                <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Stage</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Visits</th>
                <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Last Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium">{r.name ?? "—"}</p>
                    <p className="text-white/40 text-xs">{r.email}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STAGE_CLASS[r.stage] ?? "bg-white/10 text-white/40"}`}>
                      {STAGE_LABELS[r.stage] ?? r.stage}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-white/50 hidden md:table-cell">{r.visitCount}</td>
                  <td className="px-5 py-3.5 text-white/40 text-xs hidden lg:table-cell">
                    {new Date(r.lastCheckedIn).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
