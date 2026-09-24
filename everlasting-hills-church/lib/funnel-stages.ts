import type { MasterListStatus } from "@/lib/api/follow-up-pipeline";

/** Where the funnel's View buttons lead. */
export const FUNNEL_BASE = "/dashboard/admin/first-timers/funnel";

/**
 * The newcomer's journey in order — first visit, second, third, settled in —
 * followed by the two ways it can stall, which are worth seeing rather than
 * leaving off the chart.
 */
export const FUNNEL_STAGES: {
  status: MasterListStatus;
  label: string;
  note: string;
  swatch: string;
  bar: string;
}[] = [
  {
    status: "FIRST_TIMER",
    label: "First timer",
    note: "Here once — the church has just met them",
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
    note: "Three visits in — nearly settled",
    swatch: "bg-sky-500",
    bar: "bg-gradient-to-r from-sky-500 to-sky-400",
  },
  {
    status: "INTEGRATED",
    label: "Integrated",
    note: "Settled in — the Integration Team watches over them",
    swatch: "bg-emerald-500",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  },
  {
    status: "AWAY",
    label: "Away",
    note: "Stopped coming — somebody should reach them",
    swatch: "bg-amber-500",
    bar: "bg-gradient-to-r from-amber-500 to-amber-400",
  },
  {
    status: "OPTED_OUT",
    label: "Opted out",
    note: "Asked not to be contacted for now",
    swatch: "bg-gray-400",
    bar: "bg-gradient-to-r from-gray-400 to-gray-300",
  },
];

export function stageFor(status: string | null | undefined) {
  return FUNNEL_STAGES.find((stage) => stage.status === status) ?? null;
}
