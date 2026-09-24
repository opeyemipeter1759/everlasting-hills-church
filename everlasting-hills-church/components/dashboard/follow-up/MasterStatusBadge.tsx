import type { MasterListStatus } from "@/lib/api/follow-up-pipeline";

const STATUS: Record<MasterListStatus, { label: string; className: string }> = {
  FIRST_TIMER: {
    label: "First timer",
    className: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300",
  },
  SECOND_TIMER: {
    label: "Second timer",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  THIRD_TIMER: {
    label: "Third timer",
    className: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300",
  },
  INTEGRATED: {
    label: "Integrated",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  AWAY: {
    label: "Away",
    className: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300",
  },
  OPTED_OUT: {
    label: "Opted out",
    className: "bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-white/[0.07] dark:text-white/50",
  },
};

/** Where a member stands, in one word the whole team reads the same way. */
export function MasterStatusBadge({ status }: { status: MasterListStatus }) {
  const { label, className } = STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
