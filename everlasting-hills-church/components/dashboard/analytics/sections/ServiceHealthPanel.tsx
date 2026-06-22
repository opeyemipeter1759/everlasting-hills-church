"use client";
import { TrendingUp, TrendingDown, HeartPulse } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";
import { useAnalyticsServiceHealth, type ServiceHealth } from "@/lib/api/analytics";

const SVC_NAMES: Record<string, string> = { sunday: "Sunday Service", wednesday: "Wednesday", special: "Special Service" };

function scoreColor(s: number) {
  if (s >= 75) return { ring: "ring-emerald-400", text: "text-emerald-600 dark:text-emerald-400", label: "Healthy" };
  if (s >= 50) return { ring: "ring-amber-400",   text: "text-amber-600 dark:text-amber-400",     label: "Fair" };
  return           { ring: "ring-red-400",         text: "text-red-600 dark:text-red-400",         label: "Low" };
}

function HealthCard({ h }: { h: ServiceHealth }) {
  const c = scoreColor(h.healthScore);
  const trending = h.trend >= 0;
  return (
    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-900 dark:text-white">{SVC_NAMES[h.serviceKey] ?? h.serviceKey}</p>
        {trending ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
      </div>
      <div className={`w-14 h-14 rounded-full ring-4 ${c.ring} flex items-center justify-center mx-auto mb-2`}>
        <span className={`text-lg font-black ${c.text}`}>{h.healthScore}</span>
      </div>
      <p className={`text-center text-[10px] font-bold ${c.text} mb-3`}>{c.label}</p>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between"><span className="text-gray-400">Avg rate</span><span className="font-bold text-gray-800 dark:text-gray-200">{h.avgRate}%</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Trend vs prev</span><span className={`font-bold ${h.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.trend >= 0 ? "+" : ""}{h.trend}%</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Sessions reviewed</span><span className="font-bold text-gray-800 dark:text-gray-200">{h.sessionsReviewed}</span></div>
      </div>
    </div>
  );
}

export function ServiceHealthPanel() {
  const { data, isLoading } = useAnalyticsServiceHealth();
  return (
    <SectionCard title="Service Health" iconEl={<HeartPulse size={13} />}>
      {isLoading ? <SkeletonBlock className="h-40" /> : (
        <div className="flex gap-3 flex-wrap">
          {(data ?? []).filter((h) => h.sessionsReviewed > 0).map((h) => <HealthCard key={h.serviceKey} h={h} />)}
        </div>
      )}
    </SectionCard>
  );
}
