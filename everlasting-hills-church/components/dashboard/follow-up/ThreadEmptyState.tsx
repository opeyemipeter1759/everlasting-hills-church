"use client";

import { MessageSquarePlus, PhoneCall, Sparkles, UserRoundCheck } from "lucide-react";

/** Openers for the first message, so nobody faces a blank box. */
const STARTERS = [
  { icon: PhoneCall, label: "Called — no answer", text: "Called today, no answer. Will try again tomorrow." },
  { icon: UserRoundCheck, label: "Reached them", text: "Spoke to *NAME* today — they're doing well and plan to come on Sunday." },
  { icon: Sparkles, label: "Something to note", text: "" },
];

/**
 * What the thread shows before anyone has written: what this space is for,
 * and three openers that fill the box so the first message costs a tap rather
 * than a blank page.
 */
export function ThreadEmptyState({ firstName, onStart }: { firstName: string; onStart: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="relative mb-4">
        <span className="absolute -left-5 top-1 h-7 w-9 rounded-lg rounded-bl-sm bg-[#FFE8ED] dark:bg-[#87102C]/25" aria-hidden="true" />
        <span className="absolute -right-5 top-4 h-6 w-8 rounded-lg rounded-br-sm bg-gray-100 dark:bg-white/[0.08]" aria-hidden="true" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#87102C] to-[#6E0C24] text-white shadow-lg shadow-[#87102C]/20">
          <MessageSquarePlus size={24} aria-hidden="true" />
        </span>
      </div>

      <p className="text-sm font-bold text-[#111] dark:text-white">No conversation yet</p>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-white/45">
        This is where the team keeps track of {firstName} — every call, visit and answer, so whoever picks it up next
        knows where things stand.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {STARTERS.map((starter) => (
          <button
            key={starter.label}
            type="button"
            onClick={() => onStart(starter.text.replace("*NAME*", firstName))}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:-translate-y-px hover:border-[#87102C]/30 hover:text-[#87102C] hover:shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:border-[#FFB3C1]/30 dark:hover:text-[#FFB3C1]"
          >
            <starter.icon size={13} aria-hidden="true" />
            {starter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
