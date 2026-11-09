import type { ApiError } from "@/lib/api/axios";
import type { WelfareStatus } from "@/lib/api/welfare";

export function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export const URGENCY_STYLE: Record<string, { label: string; className: string }> = {
  HIGH: { label: "Very urgent", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
  MEDIUM: { label: "Somewhat urgent", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  LOW: { label: "Not urgent", className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-white/50 dark:border-white/10" },
};

export const STATUS_STYLE: Record<WelfareStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  IN_REVIEW: { label: "In review", className: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  DECLINED: { label: "Declined", className: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40" },
};

export const STATUS_TABS: { label: string; value: WelfareStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Declined", value: "DECLINED" },
];

export const EMPTY_BOX = "rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5 xs:p-8 sm:p-12 text-center";
