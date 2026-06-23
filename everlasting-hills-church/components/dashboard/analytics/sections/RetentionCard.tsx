"use client";
import { RefreshCw } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { ProgressBar } from "@/components/ui/display/ProgressBar";
import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";
import { useAnalyticsRetention, type AnalyticsFilter } from "@/lib/api/analytics";

function Row({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{value}</span>
      </div>
      <ProgressBar value={value} max={total} color={color} height="xs" />
    </div>
  );
}

export function RetentionCard({ filter }: { filter: AnalyticsFilter }) {
  const { data, isLoading } = useAnalyticsRetention(filter);

  if (isLoading || !data) return (
    <SectionCard title="Retention Rate" iconEl={<RefreshCw size={13} />}>
      <SkeletonBlock className="h-48" />
    </SectionCard>
  );

  const total = data.retained + data.lost + data.newAttendees;
  return (
    <SectionCard title="Retention Rate" iconEl={<RefreshCw size={13} />}>
      <div className="text-center mb-5">
        <p className="text-[52px] font-black text-[#87102C] leading-none">{data.rate}%</p>
        <p className="text-[11px] text-gray-400 mt-1">retained vs last period</p>
      </div>
      <div className="space-y-3">
        <Row label="Retained"     value={data.retained}    color="bg-emerald-500" total={total} />
        <Row label="Lost"         value={data.lost}         color="bg-red-500"     total={total} />
        <Row label="New Attendees" value={data.newAttendees} color="bg-blue-500"    total={total} />
      </div>
    </SectionCard>
  );
}
