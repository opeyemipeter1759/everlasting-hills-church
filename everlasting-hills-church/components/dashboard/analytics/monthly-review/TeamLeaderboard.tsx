import { Crown, Users } from "lucide-react";
import type { TeamTally } from "./useMonthlyReview";

export default function TeamLeaderboard({ teams }: { teams: TeamTally[] }) {
  const top = teams[0]?.count ?? 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Users size={15} className="text-[#87102C] dark:text-[#e8768a]" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
          All Teams ({teams.length})
        </h2>
      </div>

      {teams.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-white/40">No teams found.</p>
      ) : (
        <ul className="grid max-h-[420px] grid-cols-1 gap-x-5 gap-y-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t, i) => (
            <li key={t.name} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-gray-800 dark:text-white/80">
                  {i === 0 && t.count > 0 && <Crown size={13} className="flex-shrink-0 text-amber-500" />}
                  <span className="truncate">{t.name}</span>
                </span>
                <span className="flex-shrink-0 font-bold text-gray-900 dark:text-white tabular-nums">{t.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  className={`h-full rounded-full ${i === 0 && t.count > 0 ? "bg-[#87102C]" : "bg-[#87102C]/40"}`}
                  style={{ width: `${top > 0 ? (t.count / top) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
