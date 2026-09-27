"use client";

import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Church,
  Clock,
  Copy,
  HeartHandshake,
  Home,
  Link2,
  Megaphone,
  Send,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMe } from "@/lib/api";
import type { EvangelismSummary } from "@/lib/api/evangelism";
import { RefreshButton } from "@/components/dashboard/follow-up/header-parts";
import { showToast } from "@/components/ui/toast/toast";

function formUrl(): string {
  return typeof window === "undefined" ? "/evangelism/form" : `${window.location.origin}/evangelism/form`;
}

/** Burgundy header like Follow Up's, with the outreach form link to hand out, then the figures. */
export function EvangelismHeader({ summary }: { canLead: boolean; summary: UseQueryResult<EvangelismSummary> }) {
  const { data: me } = useMe();
  const firstName = me?.member?.firstName ?? null;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const [copied, setCopied] = useState(false);
  const s = summary.data;

  async function copy() {
    try {
      await navigator.clipboard.writeText(formUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy — the link is /evangelism/form");
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Evangelism form — record everyone you preach to today:\n${formUrl()}`,
  )}`;

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
                <Megaphone size={19} aria-hidden="true" />
              </span>
              Evangelism
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/70">
              {firstName ? `Welcome, ${firstName}. ` : ""}
              {s
                ? s.mine.inWindow > 0
                  ? `You have ${s.mine.inWindow} ${s.mine.inWindow === 1 ? "person" : "people"} in their 30-day follow-up${
                      s.mine.overdue > 0 ? `, ${s.mine.overdue} overdue` : ""
                    }.`
                  : "Go and make disciples — Matthew 28:19."
                : null}
            </p>
          </div>
          <RefreshButton onClick={() => void summary.refetch()} busy={summary.isFetching} />
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
            <Link2 size={13} aria-hidden="true" /> Outreach form
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold ring-1 ring-inset ring-white/20 hover:bg-white/25"
          >
            {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold ring-1 ring-inset ring-white/20 hover:bg-white/25"
          >
            <Send size={13} aria-hidden="true" /> Share on WhatsApp
          </a>
          <a
            href="/evangelism/form"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-[#87102C] hover:bg-white/90"
          >
            Open form
          </a>
        </div>
      </header>

      <SummaryCards summary={s} loading={summary.isLoading} />
    </section>
  );
}

function SummaryCards({ summary: s, loading }: { summary?: EvangelismSummary; loading: boolean }) {
  const cards: { icon: LucideIcon; label: string; value?: number; note?: string; tone: string }[] = [
    { icon: Users, label: "People reached", value: s?.reached, note: s ? `${s.reachedThisMonth} this month` : undefined, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
    { icon: HeartHandshake, label: "Saved", value: s?.saved, note: s ? `${s.savedThisMonth} this month` : undefined, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
    { icon: Clock, label: "Pending follow-ups", value: s?.pendingFollowUps, note: s ? `${s.dueFollowUps} due now` : undefined, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
    { icon: AlertTriangle, label: "Overdue follow-ups", value: s?.overdueFollowUps, note: s?.awaitingReview ? `${s.awaitingReview} need review` : undefined, tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" },
    { icon: Home, label: "Visitations needed", value: s?.visitationsNeeded, tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300" },
    { icon: Church, label: "Invited / attended", value: s?.invited, note: s ? `${s.attended} attended church` : undefined, tone: "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-white/10 dark:bg-[#161618] sm:p-4">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.tone}`}>
            <c.icon size={16} aria-hidden="true" />
          </span>
          <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/40">{c.label}</p>
          {loading || c.value === undefined ? (
            <span className="mt-1 block h-7 w-12 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
          ) : (
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{c.value}</p>
          )}
          {c.note && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">{c.note}</p>}
        </div>
      ))}
    </div>
  );
}
