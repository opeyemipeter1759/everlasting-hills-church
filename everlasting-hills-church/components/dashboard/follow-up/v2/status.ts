import type { PipelineStatus } from "@/lib/api/pipeline";

/**
 * The seven first-timer statuses, with the exact labels and one colour each,
 * used everywhere a first-timer appears. Colour always sits beside the label,
 * never instead of it.
 */
export const STATUS_META: Record<PipelineStatus, { label: string; chip: string; dot: string }> = {
  FIRST_TIMER: {
    label: "First timer",
    chip: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  SECOND_TIMER: {
    label: "Second timer",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  THIRD_TIMER: {
    label: "Third timer",
    chip: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  FOURTH_TIMER: {
    label: "Fourth timer",
    chip: "bg-cyan-50 text-cyan-700 ring-cyan-600/15 dark:bg-cyan-500/10 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  AWAY: {
    label: "Away",
    chip: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  INTEGRATED: {
    label: "Integrated",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  OPTED_OUT: {
    label: "Opted out",
    chip: "bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-white/[0.07] dark:text-white/50",
    dot: "bg-gray-400",
  },
};

/** Follow-up stages as the team reads them. */
export const STAGE_LABEL: Record<string, string> = {
  UNASSIGNED: "New",
  ASSIGNED: "In follow-up",
  IN_PROGRESS: "In follow-up",
  REOPENED: "Changes requested",
  AWAITING_REVIEW: "Awaiting approval",
  CONFIRMED: "Integrated",
  OPTED_OUT: "Opted out",
};

export const stageLabel = (stage: string | null) => (stage ? (STAGE_LABEL[stage] ?? stage) : "New");

/** "5 Jan 2026" from a "YYYY-MM-DD" church date, without a timezone shift. */
export function shortDate(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** wa.me link for a Nigerian number in any of the usual forms, with an optional message. */
export function waLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("234") ? digits : digits.startsWith("0") ? `234${digits.slice(1)}` : digits.length === 10 ? `234${digits}` : digits;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
