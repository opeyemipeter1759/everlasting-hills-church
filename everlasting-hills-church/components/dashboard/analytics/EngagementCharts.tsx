"use client";

import { useState } from "react";
import type { EngagementLeaderboard } from "@/services/engagement.service";
import StatCard from "./StatCard";
import { Users, Star, AlertTriangle, BarChart3, RefreshCw } from "lucide-react";

type Distribution = { label: string; range: string; value: number; color: string };
type AtRisk = { memberId: string; name: string; email: string | null; phone: string | null; photoUrl: string | null; score: number };
type Summary = { totalMembers: number; scoredMembers: number; avgScore: number; unscored: number };

type Props = {
  summary: Summary;
  leaderboard: EngagementLeaderboard;
  atRisk: AtRisk[];
  distribution: Distribution[];
};

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
      : score >= 50
      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
      : score >= 30
      ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{score}</span>
  );
}

export default function EngagementCharts({ summary, leaderboard, atRisk, distribution }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg("");
    try {
      const res = await fetch("/api/analytics/engagement/refresh", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setRefreshMsg(`Scores updated for ${json.count} members. Reload to see changes.`);
      } else {
        setRefreshMsg(json.error ?? "Failed to refresh scores.");
      }
    } catch {
      setRefreshMsg("Network error.");
    } finally {
      setRefreshing(false);
    }
  }

  const totalDist = distribution.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Scores are computed based on attendance, sermon activity, giving, and community engagement over 90 days.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 transition"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh Scores"}
        </button>
      </div>
      {refreshMsg && (
        <p className="text-xs text-green-600 dark:text-green-400">{refreshMsg}</p>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={summary.totalMembers.toLocaleString()}
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Avg Score"
          value={summary.avgScore}
          sub="out of 100"
          icon={BarChart3}
          iconColor="text-purple-400"
        />
        <StatCard
          label="Scored Members"
          value={summary.scoredMembers.toLocaleString()}
          sub={summary.unscored > 0 ? `${summary.unscored} unscored` : "all scored"}
          icon={Star}
          iconColor="text-amber-400"
        />
        <StatCard
          label="At Risk"
          value={atRisk.length.toLocaleString()}
          sub="score below 30"
          icon={AlertTriangle}
          iconColor="text-red-400"
        />
      </div>

      {/* Distribution */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Engagement Distribution
        </p>
        {totalDist === 0 ? (
          <p className="text-sm text-gray-400">
            No scores yet. Click &quot;Refresh Scores&quot; to compute them.
          </p>
        ) : (
          <div className="space-y-3">
            {distribution.map((d) => {
              const pct = totalDist > 0 ? Math.round((d.value / totalDist) * 100) : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {d.label}{" "}
                      <span className="text-gray-400">({d.range})</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {d.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leaderboard */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Engagement Leaderboard
          </p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400">No scores yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {leaderboard.map((m, i) => (
                <div
                  key={m.memberId}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                    {m.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      m.name.charAt(0)
                    )}
                  </div>
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                    {m.name}
                  </span>
                  <ScoreBadge score={m.score} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At risk */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            At-Risk Members (score &lt; 30)
          </p>
          {atRisk.length === 0 ? (
            <p className="text-sm text-gray-400">No at-risk members. Great job!</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {atRisk.map((m) => (
                <div
                  key={m.memberId}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold flex-shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{m.name}</p>
                    {m.email && (
                      <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                    )}
                  </div>
                  <ScoreBadge score={m.score} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
