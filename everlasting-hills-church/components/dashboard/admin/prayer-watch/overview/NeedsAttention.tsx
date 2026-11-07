"use client";

import { ArrowRightLeft, CheckCircle2, ClipboardX, Clock3, Crown, MessageCircle, Send, UserPlus, type LucideIcon } from "lucide-react";
import type { PrayerWatchOverviewData } from "@/lib/api/prayer-watch-overview";
import { durationWords, hoursSince, longDate, panel, panelHint, panelTitle, plural } from "./format";

interface Item {
  key: string;
  icon: LucideIcon;
  text: string;
  detail?: string;
  /** Action now, versus worth knowing about soon. */
  urgent: boolean;
}

const SOON_DAYS = 14;

/** What needs a decision or a fix, most pressing first. */
export function attentionItems(data: PrayerWatchOverviewData, now = Date.now()): Item[] {
  const items: Item[] = [];
  const { totals } = data;

  if (totals.pending > 0) {
    items.push({
      key: "pending",
      icon: UserPlus,
      urgent: true,
      text: `${plural(totals.pending, "sign-up")} waiting for approval`,
      detail: data.oldestPendingAt ? `The oldest has waited ${durationWords(hoursSince(data.oldestPendingAt, now))}.` : undefined,
    });
  }
  if (totals.familyChangesPending > 0) {
    items.push({ key: "family", icon: ArrowRightLeft, urgent: true, text: `${plural(totals.familyChangesPending, "request")} to change Watchmen Family` });
  }
  for (const s of data.slots) {
    if (s.confirmed > 0 && !s.leaderName) {
      items.push({ key: `leader-${s.id}`, icon: Crown, urgent: true, text: `${s.label} has no leader`, detail: `${plural(s.confirmed, "person", "people")} pray there without one.` });
    }
    if (s.leaderName && s.leaderTermEndsAt) {
      const daysLeft = (new Date(s.leaderTermEndsAt).getTime() - now) / 86_400_000;
      if (daysLeft <= 0) {
        items.push({ key: `term-${s.id}`, icon: Clock3, urgent: true, text: `${s.leaderName}'s three months leading the ${s.label} are up`, detail: "Choose who leads next." });
      } else if (daysLeft <= SOON_DAYS) {
        items.push({ key: `term-${s.id}`, icon: Clock3, urgent: false, text: `${s.leaderName}'s term on the ${s.label} ends ${longDate(s.leaderTermEndsAt)}` });
      }
    }
    const nights = data.reports?.chain ?? [];
    const missed = nights.filter((c) => c.watches.some((w) => w.slotId === s.id && w.status === "missing")).length;
    if (missed >= 2) {
      items.push({
        key: `reports-${s.id}`,
        icon: ClipboardX,
        urgent: missed >= 3,
        text: `${s.label} missed ${missed} of the last ${nights.length} reports`,
        detail: s.leaderName ? `Check in with ${s.leaderName}.` : "It has no leader to report it.",
      });
    }
    if (s.confirmed > 0 && !s.whatsappLinkSet) {
      items.push({ key: `wa-${s.id}`, icon: MessageCircle, urgent: false, text: `${s.label} has no family WhatsApp group linked`, detail: "Approved people can't join their family until it's added." });
    }
  }
  if (!data.telegramLinkSet) {
    items.push({ key: "telegram", icon: Send, urgent: false, text: "No central Telegram channel linked", detail: "Approved people have nowhere to join the prayer itself." });
  }
  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}

export default function NeedsAttention({ data, onManage }: { data: PrayerWatchOverviewData; onManage: () => void }) {
  const items = attentionItems(data);

  return (
    <section className={panel} aria-labelledby="attention-title">
      <h2 id="attention-title" className={panelTitle}>
        Needs attention
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} aria-hidden="true" /> All clear. Every watch has a leader and nothing is waiting.
        </p>
      ) : (
        <>
          <p className={panelHint}>Most pressing first.</p>
          <ul className="mt-3 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      item.urgent ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70"
                    }`}
                  >
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1A1210] dark:text-white">
                      <span className="sr-only">{item.urgent ? "Needs action: " : "Worth knowing: "}</span>
                      {item.text}
                    </p>
                    {item.detail && <p className="text-xs text-gray-500 dark:text-white/55">{item.detail}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={onManage}
                    className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#87102C] hover:bg-[#87102C]/5 dark:text-[#E8768A] dark:hover:bg-white/5"
                  >
                    Review
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
