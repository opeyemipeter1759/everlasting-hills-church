"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApiError } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type { MasterListRow, MasterListStatus } from "@/lib/api/follow-up-pipeline";

export interface BulkStatusInput {
  people: MasterListRow[];
  toStatus: MasterListStatus;
  note?: string;
}

/**
 * Set the status of everyone a leader has ticked. Their word is final, so this
 * takes effect at once rather than joining the queue of pending requests.
 */
export function useBulkStatusChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ people, toStatus, note }: BulkStatusInput) =>
      api.post<{ changed: number }>("/follow-up/status/bulk", {
        subjects: people.map((person) => ({
          subjectKind: person.kind,
          subjectId: person.id,
          fromStatus: person.status,
        })),
        toStatus,
        note,
      }),
    onSuccess: (result, { people, toStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["follow-up"] });
      const skipped = people.length - result.changed;
      showToast.success(
        result.changed === 0
          ? "Everyone you picked was already on that status"
          : `${result.changed} ${result.changed === 1 ? "person" : "people"} set to ${LABEL[toStatus]}` +
              (toStatus === "INTEGRATED" ? " — now with the Integration Team" : "") +
              (skipped > 0 ? ` · ${skipped} already there` : ""),
      );
    },
    onError: (err) =>
      showToast.error((err as ApiError)?.message || "Couldn't change those statuses"),
  });
}

const LABEL: Record<MasterListStatus, string> = {
  FIRST_TIMER: "First timer",
  SECOND_TIMER: "Second timer",
  THIRD_TIMER: "Third timer",
  INTEGRATED: "Integrated",
  AWAY: "Away",
  OPTED_OUT: "Opted out",
};
