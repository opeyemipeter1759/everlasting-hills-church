import type { Reader, ReaderState } from "@/lib/api/admin-reading";

export const STATE: Record<ReaderState, { label: string; badge: string }> = {
  QUIET: { label: "Gone quiet", badge: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" },
  NEW: { label: "Just started", badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" },
  READING: { label: "Reading", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  NOT_STARTED: { label: "No plan", badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60" },
  FINISHED: { label: "Finished", badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
};
export const ORDER: ReaderState[] = ["QUIET", "NEW", "READING", "NOT_STARTED", "FINISHED"];
/** One group of people: a state, everyone, or anyone who has finished a plan. */
export type Filter = "ALL" | ReaderState | "HAS_FINISHED";

const DAY_MS = 86_400_000;

export function lastRead(date: string | null, today: string) {
  if (!date) return "Never";
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

export function inGroup(reader: Reader, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "HAS_FINISHED") return reader.plans.some((plan) => plan.status === "COMPLETED");
  return reader.state === filter;
}

export const TONE = {
  brand: "border-[#E7CDD3]/70 bg-[#FFF4F6]/60 dark:border-[#FFB3C1]/20 dark:bg-[#87102C]/10",
  warn: "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10",
  good: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10",
  plain: "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
} as const;
