"use client";
import { useState } from "react";
import { Wifi, WifiOff, Clock, X } from "lucide-react";
import { useSessionBanner } from "@/lib/api";

function Countdown({ closesAt }: { closesAt: string }) {
  const diff = Math.max(0, Math.floor((new Date(closesAt).getTime() - Date.now()) / 60_000));
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return <span className="font-mono">{h > 0 ? `${h}h ` : ""}{m}m remaining</span>;
}

export function LiveSessionBanner() {
  const { data, isLoading } = useSessionBanner();
  const isOpen = data?.hasActiveSession === true;
  const session = data?.session;
  const next = data?.nextSession;


  return (
    <div className={`rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-4 transition-colors ${
      isOpen
        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
        : "bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOpen ? "bg-emerald-500/15" : "bg-gray-200/60 dark:bg-white/5"}`}>
          {isOpen ? <Wifi size={16} className="text-emerald-600 dark:text-emerald-400" /> : <WifiOff size={16} className="text-gray-400" />}
        </div>
        <div>
          <p className={`text-sm font-bold ${isOpen ? "text-emerald-700 dark:text-emerald-300" : "text-gray-900 dark:text-white"}`}>
            {isLoading ? "Checking session…" : isOpen ? `${session?.serviceName} — Session Open` : "No Active Session"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isOpen && session
              ? <Countdown closesAt={session.closesAt} />
              : next
                ? `Next: ${next.serviceName} · ${new Date(next.opensAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`
                : "Next service not scheduled"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isOpen && session && (
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Today&apos;s Check-ins</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-0.5">{session.checkedInCount}</p>
          </div>
        )}
        {!isOpen && next && (
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1"><Clock size={10} /> Opens</p>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5">
              {new Date(next.opensAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}

        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[11px] uppercase tracking-wider ${
          isOpen
            ? "bg-emerald-500/15 border-emerald-300/40 text-emerald-700 dark:text-emerald-400"
            : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
          {isLoading ? "…" : isOpen ? "Live" : "Closed"}
        </div>
      </div>
    </div>
  );
}
