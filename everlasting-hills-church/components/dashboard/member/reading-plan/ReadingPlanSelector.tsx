"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { readingHref, useReadingSubscriptions } from "@/lib/api/reading-plan";
import { Select } from "@/components/ui/select";

export default function ReadingPlanSelector({ subscriptionId, page = "reading" }: {
  subscriptionId: string;
  page?: "reading" | "schedule";
}) {
  const router = useRouter();
  const { data: subscriptions, isError, refetch } = useReadingSubscriptions();

  if (isError) {
    return <p role="alert" className="mt-5 text-sm text-red-600 dark:text-red-400">
      Could not load your other plans.{" "}
      <button type="button" onClick={() => refetch()} className="min-h-11 font-semibold underline">Try again</button>
    </p>;
  }

  if (!subscriptions?.length) return null;

  return (
    <div className="mt-5 flex min-w-0 flex-wrap items-end gap-x-4 gap-y-2 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4">
      <label className="min-w-0 flex-1 basis-52 text-xs font-semibold text-gray-600 dark:text-white/65">
        Your plans
        <Select
          aria-label="Your plans"
          value={subscriptionId}
          onChange={(id) => router.push(readingHref(id, undefined, page))}
          className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white"
          options={(["ACTIVE", "PAUSED", "COMPLETED"] as const).flatMap((status) =>
            subscriptions
              .filter((subscription) => subscription.status === status)
              .map((subscription) => ({
                value: subscription.subscriptionId,
                label: `${subscription.plan.title} · ${subscription.completedDays}/${subscription.plan.durationDays} read`,
                group: status === "ACTIVE" ? "Reading now" : status === "PAUSED" ? "Paused" : "Completed",
              })),
          )}
        />
      </label>
      <Link href="/dashboard/reading/overview" className="inline-flex min-h-11 items-center text-xs font-bold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
        View your progress
      </Link>
    </div>
  );
}
