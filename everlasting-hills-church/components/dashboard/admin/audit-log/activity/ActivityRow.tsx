"use client";

import { useState } from "react";
import { ChevronDown, Cog, Minus, Pencil, Plus, Zap } from "lucide-react";
import type { AuditItem } from "@/lib/api/audit-trail";
import { areaLabel, type Tone, toneOf, whenText } from "@/lib/audit/format";
import { ActivityDetails } from "./ActivityDetails";

const TONE: Record<Tone, { icon: typeof Plus; cls: string; word: string }> = {
  add: { icon: Plus, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", word: "New or done" },
  change: { icon: Pencil, cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", word: "Changed" },
  remove: { icon: Minus, cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400", word: "Removed" },
  other: { icon: Zap, cls: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/60", word: "Logged" },
};

/** One line in the audit trail; opens to show the details. */
export function ActivityRow({ item }: { item: AuditItem }) {
  const [open, setOpen] = useState(false);
  const tone = TONE[toneOf(item.method, item.records[0]?.action)];
  const Icon = item.kind === "record" && !item.actorId ? Cog : tone.icon;
  const who = item.actorName ?? (item.actorId ? "Someone no longer on the system" : "The system");

  return (
    <li className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#161618]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:hover:bg-white/[0.03]"
      >
        <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${tone.cls}`} title={tone.word}>
          <Icon size={15} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-gray-900 dark:text-white">
            <span className="font-bold">{who}</span> <span className="text-gray-700 dark:text-white/75">{item.summary}</span>
          </span>
          {item.targets.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {item.targets.map((t) => (
                <span key={`${t.kind}-${t.name}`} className="rounded-full bg-[#87102C]/[0.07] px-2 py-0.5 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#f3a9b8]">
                  {t.kind}: {t.name}
                </span>
              ))}
            </span>
          )}
          <span className="mt-1 block text-xs text-gray-500 dark:text-white/45">
            {areaLabel(item.area)} · {whenText(item.at)}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className={`mt-1 flex-shrink-0 text-gray-400 transition-transform dark:text-white/40 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <ActivityDetails item={item} />}
    </li>
  );
}
