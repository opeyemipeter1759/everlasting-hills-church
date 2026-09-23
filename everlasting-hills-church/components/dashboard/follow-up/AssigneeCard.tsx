"use client";

import { useState } from "react";
import { useAssignFollowUp, useFollowUpTeam } from "@/lib/api/follow-up-pipeline";
import { TeamPicker } from "./TeamPicker";

/**
 * Who is following this person up — one line, with Reassign beside it for the
 * Follow Up lead or head of department. Picking opens their unit's roster.
 */
export function AssigneeCard({
  assignedTo,
  entryId,
  canReassign,
}: {
  assignedTo: { id: string; name: string } | null;
  /** The follow-up entry to move. Without one there is nothing to reassign yet. */
  entryId: string | null;
  canReassign: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const { data: team = [], isLoading } = useFollowUpTeam();
  const assign = useAssignFollowUp();

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="w-24 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-white/45">Assigned to</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111] dark:text-white">
          {assignedTo ? assignedTo.name : <span className="font-normal text-gray-400 dark:text-white/35">Nobody yet</span>}
        </span>
        {canReassign && entryId && (
          <button
            type="button"
            onClick={() => setPicking((open) => !open)}
            className="flex-shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold text-[#87102C] transition-colors hover:bg-[#FFE8ED] dark:text-[#FFB3C1] dark:hover:bg-white/10"
          >
            {picking ? "Cancel" : assignedTo ? "Reassign" : "Assign"}
          </button>
        )}
      </div>

      {picking && entryId && (
        <div className="ml-24 mt-2">
          {isLoading && <p className="py-2 text-sm text-gray-400 dark:text-white/35">Loading your unit…</p>}
          {!isLoading && team.length === 0 && (
            <p className="py-2 text-sm text-gray-400 dark:text-white/35">Nobody else is on your unit yet.</p>
          )}
          <TeamPicker
            team={team}
            assignedToId={assignedTo?.id ?? null}
            busy={assign.isPending}
            onPick={(memberId) =>
              assign.mutate({ id: entryId, assigneeId: memberId }, { onSuccess: () => setPicking(false) })
            }
          />
        </div>
      )}
    </div>
  );
}
