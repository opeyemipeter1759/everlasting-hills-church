import Link from "next/link";
import { ArrowRight, Sparkles, TrendingDown, TrendingUp, UserCheck } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AdminDashboardData } from "@/lib/mock/admin-dashboard.mock";

/**
 * AI-style executive insights — directional metrics + a follow-up call to action.
 */
export default function AIInsightsCard({
  insights,
  ...chrome
}: { insights: AdminDashboardData["aiInsights"] } & DashboardCardChrome) {
  const attUp = insights.attendanceChange >= 0;
  const retUp = insights.visitorRetentionChange >= 0;

  return (
    <DashboardCard kicker="Executive Summary" title="AI Insights" icon={Sparkles} {...chrome}>
      <ul className="space-y-3">
        <InsightRow
          up={attUp}
          label="Attendance"
          value={`${attUp ? "+" : ""}${insights.attendanceChange}%`}
        />
        <InsightRow
          up={retUp}
          label="Visitor Retention"
          value={`${retUp ? "+" : ""}${insights.visitorRetentionChange}%`}
        />
      </ul>

      <Link
        href="/dashboard/follow-ups"
        className="group mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
      >
        <span className="flex items-center gap-2.5">
          <UserCheck size={16} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {insights.membersNeedingFollowUp} members need follow-up
          </span>
        </span>
        <ArrowRight
          size={15}
          className="text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400"
          aria-hidden="true"
        />
      </Link>
    </DashboardCard>
  );
}

function InsightRow({ up, label, value }: { up: boolean; label: string; value: string }) {
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <li className="flex items-center justify-between rounded-xl bg-[#FFF4F6]/60 px-4 py-3 dark:bg-white/[0.03]">
      <span className="flex items-center gap-2.5">
        <Icon
          size={16}
          className={up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-[#444] dark:text-white/70">{label}</span>
      </span>
      <span
        className={`text-sm font-bold tabular-nums ${
          up ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
        }`}
      >
        {value}
      </span>
    </li>
  );
}
