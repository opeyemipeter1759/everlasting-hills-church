"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { InspectionResult, InspectionRound, ReadinessState, ReadinessStatus } from "./service-readiness-plans";

export interface InspectionCheck {
  label: string;
  passed: boolean;
  note?: string;
}

export interface InspectionRow {
  readinessId: string;
  unitId: string;
  unitName: string;
  state: ReadinessState;
  planMissing: boolean;
  outstanding: string | null;
  support: string | null;
  canMeetDeadline: boolean | null;
  approvedAt: string | null;
  status: ReadinessStatus | null;
  blocker: string | null;
  /** The unit's checklist for this kind of service, in order. */
  checklist: string[];
  inspection: { result: InspectionResult; checks: InspectionCheck[]; note: string | null; inspectedAt: string } | null;
}

export interface InspectionSheet {
  service: { id: string; name: string; serviceType: "SUNDAY" | "WEDNESDAY"; scheduledAt: string; startsAt: string };
  round: InspectionRound;
  dueAt: string;
  rows: InspectionRow[];
}

export type InspectionInput = { checks: InspectionCheck[]; note?: string; ready?: boolean };

const sheetKey = (serviceId: string, round: InspectionRound) => ["service-readiness", "inspection", serviceId, round];

/** One service's inspection, for the day-before or 2-hours-before round. */
export function useInspectionSheet(serviceId: string | null, round: InspectionRound) {
  return useQuery({
    queryKey: sheetKey(serviceId ?? "", round),
    queryFn: () => api.get<InspectionSheet>(`/service-readiness/services/${encodeURIComponent(serviceId!)}/inspections/${round}`),
    enabled: !!serviceId,
  });
}

export function useSaveInspection(serviceId: string, round: InspectionRound) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, ...body }: InspectionInput & { unitId: string }) =>
      api.put<{ saved: boolean; result: InspectionResult }>(
        `/service-readiness/services/${encodeURIComponent(serviceId)}/units/${encodeURIComponent(unitId)}/inspections/${round}`,
        body,
      ),
    // Refreshes this sheet and the board's inspection chips.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-readiness"] }),
  });
}
