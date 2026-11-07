"use client";

import { useState } from "react";
import { Check, Sunrise } from "lucide-react";
import type { LedWatch } from "@/lib/api/prayer-watch-reports";
import { skyAt } from "../sky";
import { fieldCls, hintCls } from "./ui";

/** First light, for the watch that closes the night and hands it to the morning. */
const MORNING = "#F6D7A7";

/**
 * The handover itself: one band running from this watch's sky into the next
 * one's. Ticking it is the leader saying "I passed it on", or, on the last
 * watch, "I closed the night".
 */
export default function HandoverToggle({
  watch,
  checked,
  onChange,
  someoneElse,
  onSomeoneElse,
}: {
  watch: LedWatch;
  checked: boolean;
  onChange: (v: boolean) => void;
  someoneElse: string;
  onSomeoneElse: (v: string) => void;
}) {
  const [naming, setNaming] = useState(someoneElse !== "");
  const from = skyAt(watch.position);
  const to = watch.next ? skyAt(watch.position + 1).bg : MORNING;
  const next = watch.next;
  const title = next ? `I handed over to ${next.leaderName ?? `the ${next.label}`}` : "I closed the night";
  const detail = next ? (next.leaderName ? `${next.label} leader` : "No leader is named for that watch yet") : `The ${watch.label} ends the watch at ${watch.endTime}`;

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#87102C] ${
          checked ? "" : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25"
        }`}
        style={
          checked
            ? { background: `linear-gradient(100deg, ${from.bg} 0%, ${from.bg} 45%, ${to} 100%)`, color: from.text, borderColor: "transparent" }
            : undefined
        }
      >
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-current" : "border-gray-300 dark:border-white/30"}`}
        >
          {checked && <Check size={16} strokeWidth={3} />}
        </span>
        <span className={`flex min-w-0 flex-col ${checked ? "" : "text-[#111] dark:text-white"}`}>
          <span className="text-[15px] font-semibold">{title}</span>
          <span className={`text-xs ${checked ? "opacity-75" : "text-gray-500 dark:text-white/50"}`}>{detail}</span>
        </span>
        {!next && <Sunrise size={20} aria-hidden="true" className={`ml-auto flex-shrink-0 ${checked ? "" : "text-[#C97A3E]"}`} />}
      </label>

      {checked && next && !naming && (
        <button type="button" onClick={() => setNaming(true)} className="self-start text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          Someone else took over?
        </button>
      )}
      {checked && next && naming && (
        <label className="flex flex-col gap-1">
          <span className={hintCls}>Who took over from you? Leave empty if it was {next.leaderName ?? "the watch leader"}.</span>
          <input value={someoneElse} onChange={(e) => onSomeoneElse(e.target.value)} maxLength={120} className={fieldCls} placeholder="Their name" />
        </label>
      )}
    </div>
  );
}
