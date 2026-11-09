"use client";

import { fraunces } from "@/lib/fonts/prayer-watch";
import { useMyPrayerHistory, useMyPrayerSignup, usePublicPrayerWatch } from "@/lib/api/prayer-watch";
import { ConfirmedWatch } from "./ConfirmedWatch";
import { PastWatchCard } from "./PastWatchCard";
import { PendingWatch } from "./PendingWatch";
import { SignupForm } from "./SignupForm";
import { useWatchSignup } from "./useWatchSignup";
import { WatchIntro } from "./WatchIntro";

/**
 * The member's Prayer Watch page: what the watch is, then their own state
 * (awaiting approval, on a watch, or choosing one), then watches they've kept.
 */
export default function PrayerWatchScreen() {
  const watch = usePublicPrayerWatch();
  const mine = useMyPrayerSignup();
  const history = useMyPrayerHistory();
  const signup = useWatchSignup(() => watch.refetch());
  const slots = watch.data?.slots;
  const historyList = history.data ?? [];

  return (
    <div className={`${fraunces.variable} mx-auto max-w-2xl py-6 sm:py-8`}>
      <WatchIntro title={watch.data?.title ?? "Prayer Watch"} />

      {watch.isLoading || signup.meLoading || mine.isLoading ? (
        <div className="mt-8 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : watch.isError ? (
        <p className="mt-8 text-sm text-red-600 dark:text-red-400">Could not load the watch schedule. Please refresh.</p>
      ) : mine.data && mine.data.signup.status === "PENDING" ? (
        <PendingWatch mine={mine.data} slots={slots} />
      ) : mine.data ? (
        <ConfirmedWatch mine={mine.data} slots={slots} />
      ) : (
        <SignupForm signup={signup} slots={slots} />
      )}

      {historyList.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-white/45">Watches you&apos;ve kept</h2>
          <div className="mt-3 space-y-3">
            {historyList.map((item) => (
              <PastWatchCard key={item.signupId} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
