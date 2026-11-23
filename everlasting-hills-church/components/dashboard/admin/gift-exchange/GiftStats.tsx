import type { GiftEntriesResponse } from "@/lib/api/gift-exchange";

type Counts = GiftEntriesResponse["counts"];

/** The list filters, each backed by one count. */
export type GiftFilter = "GIFT_EXCHANGE" | "PICNIC" | "REJECTED";

const TILES: { value: GiftFilter | null; label: string; hint: string; count: (c: Counts) => number }[] = [
  { value: "GIFT_EXCHANGE", label: "Gift exchange", hint: "Will be paired", count: (c) => c.giftExchange },
  { value: "PICNIC", label: "Picnic", hint: "Coming to the picnic", count: (c) => c.picnic },
  { value: "REJECTED", label: "Rejected", hint: "Not taking part", count: (c) => c.REJECTED },
  { value: null, label: "All sign-ups", hint: "Everyone who signed up", count: (c) => c.total },
];

/** The numbers that matter. Tap one to show just those people; tap it again to show everyone. */
export default function GiftStats({
  counts,
  selected,
  onSelect,
}: {
  counts: Counts | null;
  selected: GiftFilter | null;
  onSelect: (f: GiftFilter | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Filter the list">
      {TILES.map((t) => {
        const on = selected === t.value;
        return (
          <button
            key={t.label}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(on || t.value === null ? null : t.value)}
            className={`rounded-xl border bg-white px-4 py-3.5 text-left transition-colors dark:bg-white/[0.03] ${
              on
                ? "border-[#87102C] bg-[#87102C]/[0.03] dark:border-[#FFB3C1]/60"
                : "border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
            }`}
          >
            <span className="block text-2xl font-bold leading-none tabular-nums text-[#111] dark:text-white">
              {counts ? t.count(counts) : "–"}
            </span>
            <span className={`mt-1.5 block text-sm font-semibold ${on ? "text-[#87102C] dark:text-[#FFB3C1]" : "text-gray-700 dark:text-white/80"}`}>
              {t.label}
            </span>
            <span className="block truncate text-xs text-gray-500 dark:text-white/45">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
