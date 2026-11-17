"use client";

import { useFirstTimerAnswers } from "@/lib/api/first-timer-profile";
import { FormAnswers } from "../profile/AnswersSection";

/**
 * Every non-pastoral answer for one row, fetched only when the row is opened.
 * The endpoint leaves pastoral answers out, so they can never reach this page.
 */
export function RowAnswers({ visitorId }: { visitorId: string }) {
  const { data, isLoading, isError } = useFirstTimerAnswers(visitorId, true);
  if (isLoading) return <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading answers" />;
  if (isError || !data) return <p className="text-sm text-gray-500 dark:text-white/50">Their answers could not load. Try again.</p>;
  return <FormAnswers answers={data} />;
}
