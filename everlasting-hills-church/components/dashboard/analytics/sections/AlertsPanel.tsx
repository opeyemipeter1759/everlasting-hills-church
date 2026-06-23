"use client";
import { useState } from "react";
import { AlertTriangle, Info, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { SkeletonLines } from "@/components/ui/display/SkeletonBlock";
import { MemberAvatar } from "@/components/ui/display/MemberAvatar";
import { useAnalyticsAlerts, type AnalyticsAlert } from "@/lib/api/analytics";

const TYPE_LABELS: Record<AnalyticsAlert["type"], string> = {
  LOW_TURNOUT: "Low Turnout", MILESTONE: "Milestone", AT_RISK: "At Risk", SESSION: "Session",
};
const ALL_TYPES = ["ALL", "AT_RISK", "MILESTONE", "LOW_TURNOUT", "SESSION"] as const;

function AlertRow({ a }: { a: AnalyticsAlert }) {
  const isWarn = a.severity === "warning";
  const hasAvatar = a.type === "AT_RISK" && a.memberName;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isWarn ? "bg-amber-50/60 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/15" : "bg-blue-50/60 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/15"}`}>
      {hasAvatar ? (
        <MemberAvatar name={a.memberName!} photoUrl={a.memberPhotoUrl} size="xs" className="mt-0.5" />
      ) : (
        <div className={`mt-0.5 shrink-0 ${isWarn ? "text-amber-500" : "text-blue-500"}`}>
          {isWarn ? <AlertTriangle size={14} /> : <Info size={14} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${isWarn ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"}`}>{TYPE_LABELS[a.type]}</span>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300">{a.message}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
      </div>
    </div>
  );
}

export function AlertsPanel() {
  const [filter, setFilter] = useState<typeof ALL_TYPES[number]>("ALL");
  const { data, isLoading } = useAnalyticsAlerts();
  const filtered = filter === "ALL" ? (data ?? []) : (data ?? []).filter((a) => a.type === filter);

  return (
    <SectionCard title="Alerts & Notifications" iconEl={<Bell size={13} />}
      action={
        <div className="flex gap-1 flex-wrap">
          {ALL_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setFilter(t)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors ${filter === t ? "bg-[#87102C] text-white border-[#87102C]" : "text-gray-500 border-gray-200 dark:border-white/10 hover:border-gray-300"}`}>
              {t === "ALL" ? "All" : TYPE_LABELS[t as AnalyticsAlert["type"]]}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? <SkeletonLines lines={3} /> : filtered.length === 0
        ? <EmptyState compact title="No alerts" description="All clear for this filter." />
        : <div className="space-y-2">{filtered.map((a) => <AlertRow key={a.id} a={a} />)}</div>
      }
    </SectionCard>
  );
}
