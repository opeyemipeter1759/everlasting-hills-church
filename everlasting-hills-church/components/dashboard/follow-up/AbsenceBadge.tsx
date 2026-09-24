"use client";

import type { MasterListRow } from "@/lib/api/follow-up-pipeline";

/**
 * Whether someone came to the most recent service that counts: "Absent" in
 * red, so the Integration Team can see at a glance who to reach first.
 */
export function AbsenceBadge({ absence }: { absence: MasterListRow["absence"] }) {
  if (!absence) return <span className="text-xs text-gray-400 dark:text-white/35">No services yet</span>;

  return absence.missedLatest ? (
    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300">
      Absent
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300">
      Present
    </span>
  );
}
