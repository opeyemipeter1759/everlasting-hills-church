import type { MasterListStatus } from "@/lib/api/follow-up-pipeline";

/** The filter controls all share one box, so the bar reads as a single piece. */
export const PILL =
  "h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/85 dark:hover:border-white/20";

/** The same colours the status badges use, as a dot for the dropdown rows. */
export const STATUS_DOT: Record<MasterListStatus, string> = {
  FIRST_TIMER: "bg-violet-500",
  SECOND_TIMER: "bg-indigo-500",
  THIRD_TIMER: "bg-sky-500",
  INTEGRATED: "bg-emerald-500",
  AWAY: "bg-amber-500",
  OPTED_OUT: "bg-gray-400",
};

export const STATUS_OPTIONS: { value: MasterListStatus; label: string; swatch: string }[] = [
  { value: "FIRST_TIMER", label: "First timer", swatch: STATUS_DOT.FIRST_TIMER },
  { value: "SECOND_TIMER", label: "Second timer", swatch: STATUS_DOT.SECOND_TIMER },
  { value: "THIRD_TIMER", label: "Third timer", swatch: STATUS_DOT.THIRD_TIMER },
  { value: "INTEGRATED", label: "Integrated", swatch: STATUS_DOT.INTEGRATED },
  { value: "AWAY", label: "Away", swatch: STATUS_DOT.AWAY },
  { value: "OPTED_OUT", label: "Opted out", swatch: STATUS_DOT.OPTED_OUT },
];

/** What is worth filtering by on each board — the rest can never match. */
export function statusOptionsFor(scope?: "FOLLOW_UP" | "INTEGRATION" | "ALL") {
  if (scope === "FOLLOW_UP") return STATUS_OPTIONS.filter((option) => option.value !== "INTEGRATED");
  if (scope === "INTEGRATION") {
    return STATUS_OPTIONS.filter((option) => option.value === "INTEGRATED" || option.value === "AWAY");
  }
  return STATUS_OPTIONS;
}

export type DatePreset = "" | "7d" | "30d" | "90d" | "year" | "custom";

export const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Pick exact dates…" },
];

const DAY = 86_400_000;

function asDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** What a preset means in plain dates; "custom" leaves the dates to the user. */
export function rangeFor(preset: DatePreset): { from?: string; to?: string } {
  const now = new Date();
  if (preset === "7d") return { from: asDay(new Date(now.getTime() - 7 * DAY)), to: undefined };
  if (preset === "30d") return { from: asDay(new Date(now.getTime() - 30 * DAY)), to: undefined };
  if (preset === "90d") return { from: asDay(new Date(now.getTime() - 90 * DAY)), to: undefined };
  if (preset === "year") return { from: `${now.getFullYear()}-01-01`, to: undefined };
  return { from: undefined, to: undefined };
}
