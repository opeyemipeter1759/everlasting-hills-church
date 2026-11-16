"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/** One unit and its inspection checklists. Every unit plans for every Sunday and Wednesday service. */
export interface ReadinessUnit {
  id: string;
  name: string;
  department: { id: string; name: string } | null;
  sundayChecklist: string[];
  wednesdayChecklist: string[];
}

/** A coming Sunday or Wednesday service, with the manual's deadlines. */
export interface UpcomingReadinessService {
  id: string;
  name: string;
  serviceType: "SUNDAY" | "WEDNESDAY";
  scheduledAt: string;
  /** Every department ready (Sunday 7:45 am, Wednesday 5:00 pm). */
  readyBy: string | null;
  /** Departments' plans due: 24 hours before ready-by. */
  planDue: string | null;
  departmentsServing: number;
}

export interface ReadinessSetup {
  units: ReadinessUnit[];
  upcoming: UpcomingReadinessService[];
}

export type ReadinessUnitInput = Pick<ReadinessUnit, "sundayChecklist" | "wednesdayChecklist">;

const SETUP_KEY = ["service-readiness", "setup"] as const;

export function useReadinessSetup() {
  return useQuery({
    queryKey: SETUP_KEY,
    queryFn: () => api.get<ReadinessSetup>("/service-readiness/setup"),
  });
}

/** Saves one unit's checklists; the server answers with the whole setup. */
export function useSaveReadinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, ...body }: ReadinessUnitInput & { unitId: string }) =>
      api.put<ReadinessSetup>(`/service-readiness/units/${encodeURIComponent(unitId)}`, body),
    onSuccess: (setup) => qc.setQueryData(SETUP_KEY, setup),
  });
}
