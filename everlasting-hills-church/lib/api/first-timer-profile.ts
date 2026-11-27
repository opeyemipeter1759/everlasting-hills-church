"use client";

import type { VisitorRow } from "@/components/dashboard/admin/FirstTimer/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { PipelineRow } from "@/lib/api/pipeline";

/** One first-timer: where they stand, and every answer they gave. Pastoral answers come only here. */
export interface FirstTimerProfileData {
  person: PipelineRow;
  answers: Record<string, unknown>;
}

export function useFirstTimerProfile(visitorId: string | undefined) {
  return useQuery({
    queryKey: ["follow-up", "first-timer", visitorId],
    queryFn: () => api.get<FirstTimerProfileData>(`/follow-up/first-timers/${visitorId}`),
    enabled: !!visitorId && typeof window !== "undefined",
  });
}

/** Answers without the pastoral ones, for a list row that is expanded. */
export function useFirstTimerAnswers(visitorId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["follow-up", "first-timer", visitorId, "answers"],
    queryFn: () => api.get<Record<string, unknown>>(`/follow-up/first-timers/${visitorId}/answers`),
    enabled,
  });
}

/** After any change to a first-timer: their profile, every list and every count. */
export function useRefreshFollowUp() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["follow-up"] });
}

/** Their record for the edit form (no prayer request), and whether the viewer may edit it. */
export function useFirstTimerRecord(visitorId: string | undefined) {
  return useQuery({
    queryKey: ["follow-up", "first-timer", visitorId, "record"],
    queryFn: () => api.get<{ record: VisitorRow; canEdit: boolean }>(`/follow-up/first-timers/${visitorId}/record`),
    enabled: !!visitorId && typeof window !== "undefined",
  });
}
