
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw, Sparkles, TrendingDown, TrendingUp, UserCheck } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AttendancePoint } from "@/lib/mock/admin-dashboard.mock";
import type { InsightsResponse } from "@/app/api/ai/insights/route";
import { postAi } from "@/lib/ai/client";

interface Props extends DashboardCardChrome {
  trend: AttendancePoint[];
  // Fallback values used while loading or if AI is unavailable
  fallback: { attendanceChange: number; visitorRetentionChange: number; membersNeedingFollowUp: number };
}

export default function AIInsightsCard({ trend, fallback, ...chrome }: Props) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const json = await postAi<InsightsResponse>("/api/ai/insights", { trend });
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (trend.length > 0) fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const display = data ?? {
    summary: null,
    attendanceChange: fallback.attendanceChange,
    visitorRetentionChange: fallback.visitorRetentionChange,
    membersNeedingFollowUp: fallback.membersNeedingFollowUp,
  };

  const attUp = display.attendanceChange >= 0;
  const retUp = display.visitorRetentionChange >= 0;

  const action = !loading && (
    <button
      type="button"
      onClick={fetchInsights}
      title="Refresh AI insights"
      className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
    >
      <RefreshCw size={13} />
    </button>
  );

  return (
    <DashboardCard
      kicker="Gemini AI"
      title="AI Insights"
      icon={Sparkles}
      action={action}
      {...chrome}
    >
      {/* Gemini-generated summary */}
      {loading ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 dark:border-violet-500/15 dark:bg-violet-500/[0.07]">
          <Loader2 size={14} className="mt-0.5 flex-shrink-0 animate-spin text-violet-500" />
          <p className="text-xs text-violet-700 dark:text-violet-300">Gemini is analysing your attendance data…</p>
        </div>
      ) : data?.summary ? (
        <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 dark:border-violet-500/15 dark:bg-violet-500/[0.07]">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-violet-800 dark:text-violet-200">
            <Sparkles size={13} className="mt-0.5 flex-shrink-0 text-violet-500" />
            {data.summary}
          </p>
        </div>
      ) : error ? (
        <div className="mb-4 rounded-xl border border-gray-200 dark:border-white/[0.07] px-4 py-3">
          <p className="text-xs text-gray-400 dark:text-white/35">{error} Showing computed metrics.</p>
        </div>
      ) : null}

      {/* Metric rows */}
      <ul className="space-y-3">
        <InsightRow
          loading={loading}
          up={attUp}
          label="Attendance"
          value={`${attUp ? "+" : ""}${display.attendanceChange}%`}
        />
        <InsightRow
          loading={loading}
          up={retUp}
          label="Visitor Retention"
          value={`${retUp ? "+" : ""}${display.visitorRetentionChange}%`}
        />
      </ul>

      {/* Follow-up CTA */}
      <Link
        href="/dashboard/follow-up"
        className="group mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
      >
        <span className="flex items-center gap-2.5">
          <UserCheck size={16} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {display.membersNeedingFollowUp} members need follow-up
          </span>
        </span>
        <ArrowRight size={15} className="text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400" aria-hidden="true" />
      </Link>
    </DashboardCard>
  );
}

function InsightRow({
  up, label, value, loading,
}: {
  up: boolean; label: string; value: string; loading: boolean;
}) {
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
      {loading ? (
        <div className="h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
      ) : (
        <span className={`text-sm font-bold tabular-nums ${up ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
          {value}
        </span>
      )}
    </li>
  );
}
