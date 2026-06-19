import { TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { fmtShortDate } from "@/utils/ServiceUtils";
import type { MemberHomeProps } from "@/types";

export function AttendanceChart({ services }: { services: MemberHomeProps["recentServices"] }) {
  const max = Math.max(...services.map((s) => s.totalAttended), 1);

  return (
    <SectionCard title="Recent Service Attendance Peaks" iconEl={<TrendingUp size={14} />}>
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp size={24} className="text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No service data yet</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
            Total members checked in per service
          </p>
          <div className="flex items-end gap-3 h-24 mb-3">
            {services.map((s, i) => {
              const pct = Math.max(8, (s.totalAttended / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {s.totalAttended}
                  </span>
                  <div className="w-full flex items-end gap-0.5" style={{ height: "72px" }}>
                    <div className="flex-1 rounded-t bg-gray-100 dark:bg-white/10" style={{ height: "100%" }} />
                    <div className="flex-1 rounded-t bg-[#87102C] opacity-80" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight">
                    {fmtShortDate(s.scheduledAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SectionCard>
  );
}
