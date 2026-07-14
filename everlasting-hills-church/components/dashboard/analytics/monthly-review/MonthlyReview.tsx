"use client";

import { Sparkles, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import StatCard from "@/components/dashboard/analytics/StatCard";
import MonthlyReviewSkeleton from "@/components/ui/skeleton/MonthlyReviewSkeleton";
import { useMonthlyReview, type ReviewCard } from "./useMonthlyReview";
import MonthNav from "./MonthNav";
import InsightBanner from "./InsightBanner";
import MembersList from "./MembersList";
import VisitorsList from "./VisitorsList";
import TeamLeaderboard from "./TeamLeaderboard";

const ICON: Record<ReviewCard["key"], LucideIcon> = {
  members: UserPlus,
  teams: Users,
  visitors: Sparkles,
};

const ICON_COLOR: Record<ReviewCard["key"], string> = {
  members: "text-[#87102C] dark:text-[#e8768a]",
  teams: "text-indigo-500",
  visitors: "text-amber-500",
};

export default function MonthlyReview() {
  const review = useMonthlyReview();

  if (review.isLoading) return <MonthlyReviewSkeleton />;

  const members = review.cards.find((c) => c.key === "members")?.value ?? 0;
  const teams = review.cards.find((c) => c.key === "teams")?.value ?? 0;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Review</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            New members, team integration, and visitors — month by month.
          </p>
        </div>

        <MonthNav
          label={review.label}
          isCurrentMonth={review.isCurrentMonth}
          isFetching={review.isFetching}
          onPrev={review.goPrev}
          onNext={review.goNext}
          onToday={review.goToday}
        />
      </div>

      <div className={`space-y-5 transition-opacity ${review.isFetching ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {review.cards.map((c) => (
            <StatCard
              key={c.key}
              label={c.label}
              value={c.value}
              trend={c.trend}
              icon={ICON[c.key]}
              iconColor={ICON_COLOR[c.key]}
            />
          ))}
        </div>

        <InsightBanner rate={review.teamRate} members={members} teams={teams} />

        {review.truncated && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Showing the first {review.members.length} new members — this month has more than that.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MembersList members={review.members} />
          <VisitorsList visitors={review.visitors} />
        </div>

        <TeamLeaderboard teams={review.teamLeaderboard} />
      </div>
    </div>
  );
}
