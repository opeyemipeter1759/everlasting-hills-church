import type { PipelineStatus } from "@/lib/api/pipeline";

/** Where the funnel's View buttons lead. */
export const FUNNEL_BASE = "/dashboard/admin/first-timers/funnel";

/**
 * The newcomer's journey in order (first visit to fourth, settled in), then
 * the ways it can pause or stop, which are worth seeing rather than leaving
 * off the chart. These are the first-timer pipeline's seven statuses, so the
 * funnel's counts are the same ones the Follow Up page shows.
 */
export const FUNNEL_STAGES: {
  status: PipelineStatus;
  label: string;
  note: string;
  swatch: string;
  bar: string;
}[] = [
  {
    status: "FIRST_TIMER",
    label: "First timer",
    note: "Here once. The church has just met them",
    swatch: "bg-violet-500",
    bar: "bg-gradient-to-r from-violet-500 to-violet-400",
  },
  {
    status: "SECOND_TIMER",
    label: "Second timer",
    note: "Came back a second time",
    swatch: "bg-indigo-500",
    bar: "bg-gradient-to-r from-indigo-500 to-indigo-400",
  },
  {
    status: "THIRD_TIMER",
    label: "Third timer",
    note: "Came a third time",
    swatch: "bg-sky-500",
    bar: "bg-gradient-to-r from-sky-500 to-sky-400",
  },
  {
    status: "FOURTH_TIMER",
    label: "Fourth timer",
    note: "Four visits or more, put forward to be integrated",
    swatch: "bg-cyan-500",
    bar: "bg-gradient-to-r from-cyan-500 to-cyan-400",
  },
  {
    status: "INTEGRATED",
    label: "Integrated",
    note: "Settled in, and approved by their unit lead",
    swatch: "bg-emerald-500",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  },
  {
    status: "AWAY",
    label: "Away",
    note: "Marked away by the Follow Up team",
    swatch: "bg-amber-500",
    bar: "bg-gradient-to-r from-amber-500 to-amber-400",
  },
  {
    status: "OPTED_OUT",
    label: "Opted out",
    note: "Asked not to be followed up, or their account was deactivated",
    swatch: "bg-gray-400",
    bar: "bg-gradient-to-r from-gray-400 to-gray-300",
  },
];

export function stageFor(status: string | null | undefined) {
  return FUNNEL_STAGES.find((stage) => stage.status === status) ?? null;
}
