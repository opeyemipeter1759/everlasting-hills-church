"use client";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useTodayFeed } from "@/lib/api";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function TodayFeed() {
  const { data, isLoading, refetch, isFetching } = useTodayFeed();
  const checkins = data?.checkins ?? [];

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 size={14} className="text-emerald-500" /></div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Today&apos;s Check-ins</p>
            <p className="text-[11px] text-gray-400">
              {data?.serviceName ? `${data.serviceName} · ` : ""}{isLoading ? "Loading…" : `${checkins.length} checked in`}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh feed"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/8 no-scrollbar max-h-[360px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2 w-16 bg-gray-100 dark:bg-gray-700/60 rounded" />
              </div>
            </div>
          ))
        ) : checkins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <CheckCircle2 size={28} className="opacity-30" />
            <p className="text-sm">No check-ins yet today</p>
          </div>
        ) : (
          checkins.map((c) => (
            <div key={c.userId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photoUrl} alt={c.userName} className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center shrink-0 text-[11px] font-black text-[#87102C] dark:text-[#e8768a] uppercase">
                  {c.userName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{c.userName}</p>
                <p className="text-[10px] text-gray-400">{c.markedBy === "ADMIN" ? "Marked by admin" : "Self check-in"}</p>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(c.markedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
