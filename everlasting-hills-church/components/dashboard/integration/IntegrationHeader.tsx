"use client";

import { CalendarDays, HeartHandshake } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/lib/api";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import type { MasterListPage } from "@/lib/api/follow-up-pipeline";
import { RefreshButton } from "@/components/dashboard/follow-up/header-parts";
import { IntegrationStats } from "./IntegrationStats";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Who this team is and what is waiting for them today. */
export function IntegrationHeader({ absence }: { absence?: MasterListPage["meta"] }) {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const { data: counts, isLoading, isFetching } = useFollowUpCounts();
  const firstName = me?.member?.firstName ?? null;
  const away = counts?.byStatus.AWAY ?? 0;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="space-y-3">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#87102C] via-[#9B1435] to-[#5E0A1E] px-6 py-7 text-white shadow-xl shadow-[#87102C]/25 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#FFB3C1]/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
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
            <p className="mt-2 flex max-w-md flex-wrap items-center gap-x-1 text-sm text-white/70">
              {firstName ? `${greeting()}, ${firstName}.` : null}
              {isLoading ? (
                <span className="inline-block h-4 w-56 animate-pulse rounded bg-white/20" />
              ) : away > 0 ? (
                <span>
                  {away} {away === 1 ? "member has" : "members have"} stopped coming. Nobody should slip away quietly.
                </span>
              ) : (
                <span>Nobody has slipped away. Everyone integrated is still being seen.</span>
              )}
            </p>
          </div>

          <RefreshButton
            onClick={() => queryClient.invalidateQueries({ queryKey: ["follow-up"] })}
            busy={isFetching}
          />
        </div>
      </header>

      <IntegrationStats absence={absence} />
    </section>
  );
}
