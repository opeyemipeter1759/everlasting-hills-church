"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type SalvationDecisionType = "FIRST_TIME" | "REDEDICATION";

/** Every field of a submission — the admin screen shows the whole thing. */
export interface SalvationDecision {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  decision: SalvationDecisionType;
  location: string | null;
  churchName: string | null;
  interestedInBaptism: boolean | null;
  message: string | null;
  note: string | null;
  contactedAt: string | null;
  createdAt: string;
  Event: { id: string; slug: string; title: string } | null;
  Member: { id: string; firstName: string; lastName: string; email: string | null } | null;
  ContactedBy: { id: string; Member: { firstName: string; lastName: string } | null } | null;
}

const KEY = ["salvation-decisions"];

export function useSalvationDecisions() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<SalvationDecision[]>("/forms/salvation"),
    staleTime: 30 * 1000,
  });
}

export function useSetSalvationContacted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contacted, note }: { id: string; contacted: boolean; note?: string }) =>
      api.patch<SalvationDecision>(`/forms/salvation/${id}/contacted`, { contacted, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function decisionLabel(decision: SalvationDecisionType): string {
  return decision === "FIRST_TIME" ? "Gave their life to Christ" : "Rededicated their life";
}
