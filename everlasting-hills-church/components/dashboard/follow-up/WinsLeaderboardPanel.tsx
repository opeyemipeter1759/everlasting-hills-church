"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Handshake, PartyPopper, Sparkles, Trophy } from "lucide-react";
import type { LeaderboardRow, WinItem, WinType } from "@/types/follow-up";
import { useFollowUpLeaderboard, useFollowUpWins } from "@/lib/api/follow-up-pipeline";
import { timeAgo } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { ConfettiFall } from "@/components/ui/motion/ConfettiFall";
import { PersonAvatar } from "./PersonAvatar";

const WINS_LAST_SEEN_KEY = "followup-wins-last-seen";

const WIN_ICON: Record<WinType, typeof Trophy> = {
  CONFIRMED_OUTCOME: Trophy,
  CONNECTION_MADE: Handshake,
};

const WIN_ICON_STYLE: Record<WinType, string> = {
  CONFIRMED_OUTCOME: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CONNECTION_MADE: "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]",
};

function WinCard({ win }: { win: WinItem }) {
  const Icon = WIN_ICON[win.type];
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${WIN_ICON_STYLE[win.type]}`}>
        <Icon size={14} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#111] dark:text-white leading-relaxed">{win.message}</p>
        <p className="text-[10px] text-[#8a7e80] dark:text-white/35 mt-0.5">{timeAgo(win.at)}</p>
      </div>
    </li>
  );
}

function LeaderboardRowItem({
  row, highlighted, isViewer,
}: { row: LeaderboardRow; highlighted?: boolean; isViewer?: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-2.5 ${
        highlighted ? "bg-[#FFF4F6] dark:bg-[#87102C]/10" : ""
      }`}
    >
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
          row.rank <= 3
            ? "bg-[#87102C] text-white"
            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50"
        }`}
      >
        {row.rank}
      </span>
      <PersonAvatar person={{ id: row.memberId, name: row.name, photoUrl: row.photoUrl }} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#111] dark:text-white truncate">
          {row.name}
          {isViewer && <span className="ml-1.5 text-[10px] font-bold text-[#87102C] dark:text-[#FFB3C1]">(You)</span>}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-[11px] text-gray-500 dark:text-white/40 tabular-nums">
        <span title="Contacts logged" className="w-14 text-center">{row.contactsLogged} calls</span>
        <span title="Connections made" className="w-14 text-center">{row.connectionsMade} conn.</span>
        <span title="Confirmed outcomes" className="w-14 text-center">{row.confirmed} won</span>
      </div>
      <span className="text-sm font-black text-[#87102C] dark:text-[#FFB3C1] tabular-nums flex-shrink-0 w-10 text-right">
        {row.score}
      </span>
    </li>
  );
}

export function WinsLeaderboardPanel() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const { data: wins, isLoading: winsLoading } = useFollowUpWins();
  const { data: leaderboard, isLoading: lbLoading } = useFollowUpLeaderboard(period);

  const [celebrate, setCelebrate] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !wins || wins.length === 0) return;
    fired.current = true;
    try {
      const lastSeenRaw = window.localStorage.getItem(WINS_LAST_SEEN_KEY);
      const lastSeen = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;
      const newest = Math.max(...wins.map((w) => new Date(w.at).getTime()));
      if (newest > lastSeen) {
        setCelebrate(true);
        window.setTimeout(() => setCelebrate(false), 3200);
      }
      window.localStorage.setItem(WINS_LAST_SEEN_KEY, new Date(newest).toISOString());
    } catch {
      // localStorage unavailable (private mode, etc.) — skip the celebration, not fatal.
    }
  }, [wins]);

  const viewerInTop = !!leaderboard?.viewer && leaderboard.top.some((r) => r.memberId === leaderboard.viewer!.memberId);

  return (
    <div className="relative space-y-5">
      {celebrate && <ConfettiFall className="z-10" />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Wins feed */}
        <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
              <PartyPopper size={12} aria-hidden="true" />
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Wins Feed</p>
          </div>
          {winsLoading ? (
            <div className="py-10 text-center text-xs text-[#8a7e80] dark:text-white/35">Loading…</div>
          ) : !wins || wins.length === 0 ? (
            <EmptyState icon={Sparkles} title="No wins yet" description="Confirmed outcomes and new connections will show up here." compact />
          ) : (
            <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06] max-h-[420px] overflow-y-auto no-scrollbar">
              {wins.map((w) => <WinCard key={w.id} win={w} />)}
            </ul>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
                <Trophy size={12} aria-hidden="true" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Leaderboard</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 p-0.5" role="tablist" aria-label="Leaderboard period">
              {(["week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={period === p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize whitespace-nowrap transition-colors ${
                    period === p ? "bg-[#87102C] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {leaderboard && (
            <div className="px-5 py-2.5 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]">
              {leaderboard.overdueCount === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-2.5 py-1">
                  <CheckCircle2 size={11} aria-hidden="true" />
                  Team is all caught up 🎉
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-2.5 py-1">
                  {leaderboard.overdueCount} overdue across the team
                </span>
              )}
            </div>
          )}

          {lbLoading ? (
            <div className="py-10 text-center text-xs text-[#8a7e80] dark:text-white/35">Loading…</div>
          ) : !leaderboard || leaderboard.top.length === 0 ? (
            <EmptyState icon={Trophy} title="No activity yet" description="Log contacts and make connections to climb the board." compact />
          ) : (
            <>
              <ul className="divide-y divide-[#E7CDD3]/20 dark:divide-white/[0.05] max-h-[360px] overflow-y-auto no-scrollbar">
                {leaderboard.top.map((row) => (
                  <LeaderboardRowItem
                    key={row.memberId}
                    row={row}
                    highlighted={row.memberId === leaderboard.viewer?.memberId}
                    isViewer={row.memberId === leaderboard.viewer?.memberId}
                  />
                ))}
              </ul>
              {leaderboard.viewer && !viewerInTop && (
                <ul className="border-t border-dashed border-[#E7CDD3]/60 dark:border-white/[0.09]">
                  <LeaderboardRowItem row={leaderboard.viewer} highlighted isViewer />
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
