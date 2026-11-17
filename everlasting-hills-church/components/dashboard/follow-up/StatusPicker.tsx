"use client";

import { Clock3 } from "lucide-react";
import type { MasterListStatus, MasterListRow } from "@/lib/api/follow-up-pipeline";
import { STATUS_OPTIONS } from "./filter-bits";

/**
 * Where someone stands, read-only. Statuses are no longer picked by hand:
 * visits make someone a second or third timer and a unit lead's approval
 * integrates them. Opting out and restoring are actions on their profile.
 */
export function StatusPicker({
  status,
  awaiting,
}: {
  person?: MasterListRow;
  status: MasterListStatus;
  awaiting: MasterListStatus | null;
}) {
  const option = STATUS_OPTIONS.find((o) => o.value === status);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-white/45">Status</span>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-[#111] dark:text-white">
          {option && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${option.swatch}`} />}
          {option?.label ?? status}
        </span>
      </div>
      <p className="ml-24 mt-2 text-xs text-gray-400 dark:text-white/35">
        Visits and approvals set this. Opt out or restore from their profile.
      </p>
      {awaiting && (
        <p className="ml-24 mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Clock3 size={12} aria-hidden="true" />
          An old request for {STATUS_OPTIONS.find((o) => o.value === awaiting)?.label} is still waiting
        </p>
      )}
    </div>
  );
}
