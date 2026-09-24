"use client";

import { Clock3 } from "lucide-react";
import { useRequestStatusChange, type MasterListStatus, type MasterListRow } from "@/lib/api/follow-up-pipeline";
import { Select } from "@/components/ui/select";
import { useFollowUpLeadership } from "./useFollowUpLeadership";
import { PILL, STATUS_OPTIONS } from "./filter-bits";

/**
 * Change where someone stands — label and dropdown on one line, so it costs a
 * row rather than a block. Anyone on the team may pick a new status; it waits
 * for the Follow Up lead or head of department unless the picker is one.
 */
export function StatusPicker({
  person,
  status,
  awaiting,
}: {
  person: MasterListRow;
  status: MasterListStatus;
  awaiting: MasterListStatus | null;
}) {
  const request = useRequestStatusChange();
  const { canApprove } = useFollowUpLeadership();

  return (
    <div>
      <div className="flex items-center gap-3">
        <label htmlFor="person-status" className="w-24 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-white/45">
          Status
        </label>
        <Select
          id="person-status"
          aria-label="Status"
          value={status}
          disabled={request.isPending}
          onChange={(next) =>
            request.mutate({
              subjectKind: person.kind,
              subjectId: person.id,
              fromStatus: status,
              toStatus: next as MasterListStatus,
            })
          }
          className={`${PILL} min-w-0 flex-1`}
          options={STATUS_OPTIONS}
        />
      </div>

      {status === "INTEGRATED" && !awaiting && (
        <p className="mt-2 ml-24 text-xs text-emerald-600 dark:text-emerald-400">
          Settled in — they sit with the Integration Team now, not on the Follow Up list.
        </p>
      )}

      {awaiting && (
        <p className="mt-2 ml-24 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Clock3 size={12} aria-hidden="true" />
          {STATUS_OPTIONS.find((o) => o.value === awaiting)?.label} — waiting for approval
        </p>
      )}
      {!awaiting && !canApprove && (
        <p className="mt-2 ml-24 text-xs text-gray-400 dark:text-white/35">A leader has to approve your change.</p>
      )}
    </div>
  );
}
