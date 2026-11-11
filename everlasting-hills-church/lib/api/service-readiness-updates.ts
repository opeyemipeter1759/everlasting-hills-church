"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ReadinessStatus } from "@/lib/api/service-readiness-plans";

const unitPath = (serviceId: string, unitId: string) =>
  `/service-readiness/services/${encodeURIComponent(serviceId)}/units/${encodeURIComponent(unitId)}`;

/** A unit leader sends the unit's task list to the Administrator, who is emailed it. */
export function useSendReadinessPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, unitId }: { serviceId: string; unitId: string }) =>
      api.put<{ saved: boolean }>(`${unitPath(serviceId, unitId)}/plan`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-readiness"] }),
  });
}

/** A unit leader reports on a submitted plan: everything ready, or a blocker (with what it is). */
export function usePostReadinessUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, unitId, ...body }: { serviceId: string; unitId: string; status: ReadinessStatus; note?: string }) =>
      api.post<{ saved: boolean; status: ReadinessStatus }>(`${unitPath(serviceId, unitId)}/updates`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-readiness"] }),
  });
}

/** The Church Administrator approves a unit's submitted plan. */
export function useApproveReadinessPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, unitId }: { serviceId: string; unitId: string }) =>
      api.put<{ approved: boolean }>(`${unitPath(serviceId, unitId)}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-readiness", "board"] }),
  });
}
