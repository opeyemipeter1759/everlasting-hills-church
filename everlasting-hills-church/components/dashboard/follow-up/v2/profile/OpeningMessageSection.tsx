"use client";

import Link from "next/link";
import { useOpeningContext } from "@/lib/api/opening-message";
import { SendsList, churchTime } from "@/components/dashboard/first-timers/SendsList";
import type { ProfileSectionProps } from "./types";

/**
 * The opening message on a first-timer's profile: whether they have been
 * contacted, and every send so far. Sending happens only in the Guest Care
 * Coordinator's Welcome queue, on WhatsApp; the welcome email goes out on its
 * own when they fill the form.
 */
export default function OpeningMessageSection({ profile }: ProfileSectionProps) {
  const { person } = profile;
  const query = useOpeningContext(person.visitorId);

  if (query.isLoading) return <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading the opening message" />;
  const ctx = query.data;
  if (!ctx || (!ctx.canSend && ctx.sends.length === 0)) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-label="Opening message">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#111] dark:text-white">Opening message</h2>
        <p className="text-xs text-gray-500 dark:text-white/45">
          {person.firstContactedAt ? `First contacted ${churchTime(person.firstContactedAt)}` : "Nobody has contacted them yet"}
        </p>
      </div>

      {ctx.canSend && (
        <p className="mt-3 text-sm text-gray-600 dark:text-white/60">
          Send it from the{" "}
          <Link href="/dashboard/first-timers" className="font-semibold text-[#87102C] underline-offset-2 hover:underline dark:text-[#FFB3C1]">
            Welcome queue
          </Link>
          .
        </p>
      )}

      <h3 className="mt-4 text-xs font-semibold text-gray-500 dark:text-white/45">Sent so far</h3>
      <div className="mt-1">
        <SendsList sends={ctx.sends} />
      </div>
    </section>
  );
}
