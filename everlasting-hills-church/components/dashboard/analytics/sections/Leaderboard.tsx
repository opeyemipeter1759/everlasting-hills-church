"use client";
import { useState } from "react";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { ProgressBar } from "@/components/ui/display/ProgressBar";
import { SkeletonLines } from "@/components/ui/display/SkeletonBlock";
import { MemberAvatar } from "@/components/ui/display/MemberAvatar";
import { Trophy } from "lucide-react";
import { useAnalyticsLeaderboard, type AnalyticsFilter } from "@/lib/api/analytics";

const LIMITS = [3, 5, 10] as const;
const RANK_STYLE = ["text-amber-500","text-gray-400","text-orange-400"];

export function Leaderboard({ filter }: { filter: AnalyticsFilter }) {
  const [limit, setLimit] = useState<3|5|10>(5);
  const { data, isLoading } = useAnalyticsLeaderboard(filter, limit);

  return (
    <SectionCard
      title="Attendance Leaderboard"
      iconEl={<Trophy size={13} />}
      action={
        <div className="inline-flex gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-white/5">
          {LIMITS.map((l) => (
            <button key={l} type="button" onClick={() => setLimit(l)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${limit === l ? "bg-white dark:bg-[#2a2a2e] text-[#87102C] shadow-sm" : "text-gray-500"}`}>
              Top {l}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? <SkeletonLines lines={limit} /> : (
        <div className="space-y-3">
          {(data ?? []).map((row, idx) => (
            <div key={row.userId} className="flex items-center gap-3">
              <span className={`text-sm font-black w-5 shrink-0 text-center ${RANK_STYLE[idx] ?? "text-gray-400"}`}>{idx + 1}</span>
              <MemberAvatar name={row.name} photoUrl={row.photoUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{row.name}</span>
                  {row.currentStreak >= 4 && <span title="Hot streak" className="text-xs">🔥</span>}
                </div>
                <ProgressBar value={row.rate} showLabel height="xs" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-gray-900 dark:text-white">{row.rate}%</p>
                <p className="text-[9px] text-gray-400">{row.currentStreak}🔥 streak</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
