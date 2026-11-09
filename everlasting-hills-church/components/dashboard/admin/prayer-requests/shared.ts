import type { ApiError } from "@/lib/api/axios";
import type { PrayerRequestRow, PrayerRequestStatus } from "@/lib/api/prayer-requests";

export function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/** Signed-in submitters are always named here, even when they ticked anonymous. */
export function submitterName(r: PrayerRequestRow): string {
  return r.member ? `${r.member.firstName} ${r.member.lastName}` : r.isAnonymous ? "Anonymous" : r.name || "Anonymous";
}

export const URGENCY_STYLE: Record<string, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
  "needs-attention": { label: "Needs attention", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  routine: { label: "Routine", className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-white/50 dark:border-white/10" },
};

// Only two statuses exist, so "Pending" and "All" would be identical once
// prayed-for requests are archived out of the active view — one active tab,
// one archive tab, same idiom as the Follow-Up Pipeline's All/Archive split.
export const STATUS_TABS: { label: string; value: PrayerRequestStatus | "" }[] = [
  { label: "Pending", value: "" },
  { label: "Prayed for", value: "PRAYED" },
];

export const EMPTY_BOX = "rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5 xs:p-8 sm:p-12 text-center";
