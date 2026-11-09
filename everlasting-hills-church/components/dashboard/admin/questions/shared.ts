import type { ApiError } from "@/lib/api/axios";
import type { QuestionRow, QuestionStatus } from "@/lib/api/questions";

export function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/** Signed-in submitters are always named here, even when they ticked anonymous. */
export function submitterName(r: QuestionRow): string {
  return r.member ? `${r.member.firstName} ${r.member.lastName}` : r.isAnonymous ? "Anonymous" : r.name || "Anonymous";
}

export const STATUS_TABS: { label: string; value: QuestionStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Answered", value: "ANSWERED" },
];

export const EMPTY_BOX = "rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5 xs:p-8 sm:p-12 text-center";
