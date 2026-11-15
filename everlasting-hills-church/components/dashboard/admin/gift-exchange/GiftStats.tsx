import { CheckCircle2, Users, XCircle, type LucideIcon } from "lucide-react";
import type { GiftEntriesResponse, GiftEntryStatus } from "@/lib/api/gift-exchange";

type Counts = GiftEntriesResponse["counts"];

const TILES: { value: GiftEntryStatus | null; label: string; hint: string; icon: LucideIcon; tone: string; count: (c: Counts) => number }[] = [
  { value: "INTERESTED", label: "Interested", hint: "Will be paired", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300", count: (c) => c.INTERESTED },
  { value: "REJECTED", label: "Rejected", hint: "Won't be paired", icon: XCircle, tone: "text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-300", count: (c) => c.REJECTED },
  { value: null, label: "Total sign-ups", hint: "Everyone who tapped “I'm interested”", icon: Users, tone: "text-[#87102C] bg-[#FFE8ED] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]", count: (c) => c.total },
];

/** The three numbers that matter. Tap one to show just those people; tap it again to show everyone. */
export default function GiftStats({ counts, selected, onSelect }: { counts: Counts | null; selected: GiftEntryStatus | null; onSelect: (s: GiftEntryStatus | null) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Filter by status">
      {TILES.map((t) => {
        const on = selected === t.value;
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(on ? null : t.value)}
            className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-white/[0.03] ${
              on ? "border-[#87102C] ring-2 ring-[#87102C]/15 dark:border-[#FFB3C1]" : "border-gray-200 dark:border-white/10"
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.tone}`}><Icon size={20} aria-hidden="true" /></span>
            <span className="min-w-0">
              <span className="block text-2xl font-black leading-none tabular-nums text-[#111] dark:text-white">{counts ? t.count(counts) : "–"}</span>
              <span className="mt-1 block text-sm font-bold text-gray-700 dark:text-white/80">{t.label}</span>
              <span className="block truncate text-xs text-gray-500 dark:text-white/45">{t.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
