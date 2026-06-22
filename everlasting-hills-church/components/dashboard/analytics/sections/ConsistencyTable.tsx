"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown, Flame } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { CircleProgress } from "@/components/ui/feedback/CircleProgress";
import { SkeletonLines } from "@/components/ui/display/SkeletonBlock";
import { MemberAvatar } from "@/components/ui/display/MemberAvatar";
import { useAnalyticsConsistency, type ConsistencyRow, type AnalyticsFilter } from "@/lib/api/analytics";

type SortKey = "consistencyScore" | "currentStreak" | "longestStreak" | "missedStreak";

function TH({ label, col, sort, onSort }: { label: string; col: SortKey; sort: { col: SortKey; dir: "asc"|"desc" }; onSort: (c: SortKey) => void }) {
  const active = sort.col === col;
  return (
    <th onClick={() => onSort(col)} className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-white select-none whitespace-nowrap">
      <span className="inline-flex items-center gap-0.5">{label}{active && (sort.dir === "asc" ? <ChevronUp size={9}/> : <ChevronDown size={9}/>)}</span>
    </th>
  );
}

export function ConsistencyTable({ filter }: { filter: AnalyticsFilter }) {
  const [sort, setSort] = useState<{ col: SortKey; dir: "asc"|"desc" }>({ col: "consistencyScore", dir: "desc" });
  const { data, isLoading } = useAnalyticsConsistency(filter, 10);
  const onSort = (col: SortKey) => setSort((s) => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));
  const rows = [...(data ?? [])].sort((a, b) => sort.dir === "desc" ? (b[sort.col] as number) - (a[sort.col] as number) : (a[sort.col] as number) - (b[sort.col] as number));

  return (
    <SectionCard title="Consistency Scores" iconEl={<Flame size={13} />}>
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full">
          <thead className="bg-gray-50/70 dark:bg-white/[0.02]">
            <tr>
              <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Member</th>
              <TH label="Score"        col="consistencyScore" sort={sort} onSort={onSort} />
              <TH label="Cur. Streak"  col="currentStreak"   sort={sort} onSort={onSort} />
              <TH label="Best Streak"  col="longestStreak"   sort={sort} onSort={onSort} />
              <TH label="Missed"       col="missedStreak"    sort={sort} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/8">
            {isLoading ? (
              <tr><td colSpan={5} className="px-3 py-2"><SkeletonLines lines={4} /></td></tr>
            ) : rows.map((r) => (
              <tr key={r.userId} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={r.name} photoUrl={r.photoUrl} size="xs" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">{r.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2"><div className="flex items-center gap-1.5"><CircleProgress value={r.consistencyScore} /><span className="text-xs font-bold text-gray-800 dark:text-gray-200">{r.consistencyScore}%</span></div></td>
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{r.currentStreak}🔥</td>
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{r.longestStreak}</td>
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{r.missedStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
