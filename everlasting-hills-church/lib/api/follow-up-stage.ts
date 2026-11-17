"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApiError } from "@/lib/api/axios";
import type { PipelineRow } from "@/lib/api/pipeline";
import { showToast } from "@/components/ui/toast/toast";

/** What the viewer may do to one first-timer, decided by the API so the profile only offers what will work. */
export interface FollowUpActions {
  canReassign: boolean;
  canOptOut: boolean;
  canRestore: boolean;
  canArchive: boolean;
  /** Why Restore is not offered while they are opted out, in plain words. */
  restoreBlockedBy: string | null;
}

const message = (err: unknown, fallback: string) => (err as ApiError)?.message || fallback;

export function useFollowUpActions(visitorId: string) {
  return useQuery({
    queryKey: ["follow-up", "first-timer", visitorId, "actions"],
    queryFn: () => api.get<FollowUpActions>(`/follow-up/first-timers/${visitorId}/actions`),
    enabled: !!visitorId && typeof window !== "undefined",
  });
}

/** Opt out or restore. Every list, count and the profile re-read afterwards. */
export function useStageAction(visitorId: string, action: "opt-out" | "restore") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<PipelineRow>(`/follow-up/first-timers/${visitorId}/${action}`),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(action === "opt-out" ? `${row.firstName} is opted out` : `${row.firstName} is back in follow-up`);
    },
    onError: (err) => showToast.error(message(err, "Couldn't save that change")),
  });
}

/** Archive a first-timer (admins only). Nothing is deleted; they drop out of every list and count. */
export function useArchiveFirstTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (visitorId: string) => api.delete<{ id: string; archived: true }>(`/visitors/${visitorId}`),
    // Archiving touches the follow-up lists, the admin first-timer page and every count.
    onSuccess: () => qc.invalidateQueries(),
    onError: (err) => showToast.error(message(err, "Couldn't archive them")),
  });
}
