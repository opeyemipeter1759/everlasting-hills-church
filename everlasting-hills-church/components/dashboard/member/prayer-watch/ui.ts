import type { PublicSlot } from "@/lib/api/prayer-watch";
import { WATCH_COLORS } from "./sky";

export const fieldCls =
  "min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] placeholder:text-gray-400 outline-none transition-colors focus:border-[#87102C]/50 focus:ring-1 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#FFB3C1]/50 dark:focus:ring-[#FFB3C1]/20";

/** A watch's colours, by its position in the night (first watch, second watch…). */
export function watchColorFor(slots: PublicSlot[] | undefined, slotId: string | undefined) {
  if (!slots || !slotId) return null;
  const i = slots.findIndex((s) => s.id === slotId);
  return i === -1 ? null : WATCH_COLORS[i % WATCH_COLORS.length];
}

/** Background and text for the member's own watch card, falling back to the night sky. */
export function watchCardStyle(slots: PublicSlot[] | undefined, slotId: string) {
  const c = watchColorFor(slots, slotId);
  return { background: c?.bg ?? "#150E22", color: c?.text ?? "#fff" };
}
