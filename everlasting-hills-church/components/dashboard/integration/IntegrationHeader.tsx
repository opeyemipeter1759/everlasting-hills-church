"use client";

import { CalendarDays, HeartHandshake } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/lib/api";
import type { PipelinePage } from "@/lib/api/pipeline";
import { RefreshButton } from "@/components/dashboard/follow-up/header-parts";
import { IntegrationStats } from "./IntegrationStats";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** What the open list says, in a sentence. Its figures are the list's own counts. */
function summary(page: PipelinePage, serviceName: string | null): string {
  const integrated = page.counts.INTEGRATED;
  if (serviceName) {
    const missed = page.counts.all;
    if (missed === 0) return `Nobody here missed ${serviceName}.`;
    return `${missed} ${missed === 1 ? "person" : "people"} missed ${serviceName}, ${integrated} of them integrated.`;
  }
  if (integrated === 0) return "Nobody is integrated yet.";
  return `${integrated} ${integrated === 1 ? "person is" : "people are"} integrated. Keep an eye out for anyone who stops coming.`;
}

/** Who this team is, and what the list below says today. */
export function IntegrationHeader({ page, serviceName }: { page?: PipelinePage; serviceName: string | null }) {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const firstName = me?.member?.firstName ?? null;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="space-y-3">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#87102C] via-[#9B1435] to-[#5E0A1E] px-5 py-6 text-white shadow-xl shadow-[#87102C]/25 sm:px-8 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
              <CalendarDays size={13} aria-hidden="true" />
              {today}
            </p>
            <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold leading-tight sm:text-[28px]">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/20">
                <HeartHandshake size={19} aria-hidden="true" />
              </span>
              Integration Team
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/75">
              {firstName ? `${greeting()}, ${firstName}. ` : null}
              {page ? summary(page, serviceName) : <span className="inline-block h-4 w-48 animate-pulse rounded bg-white/20 align-middle" />}
            </p>
          </div>
          <RefreshButton onClick={() => queryClient.invalidateQueries({ queryKey: ["follow-up"] })} busy={false} />
        </div>
      </header>

      <IntegrationStats page={page} serviceName={serviceName} />
    </section>
  );
}
