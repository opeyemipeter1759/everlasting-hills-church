"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { CreateRequestInput, HostSummary, MyRequest, SlotDay } from "@/lib/api/one-on-one";

/** The visitor side of One-on-One: no account, so nothing here sends a session. */

export const FOUND_VIA = ["YouTube", "Telegram", "Facebook", "Instagram", "A friend", "Other"] as const;
export type FoundVia = (typeof FOUND_VIA)[number];

export interface VisitorRequestInput extends CreateRequestInput {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  foundVia: FoundVia;
  inIbadan: boolean;
  timezone?: string;
  website?: string;
  /** Made on the general page, where no pastor is named. */
  viaIntake?: boolean;
}

export interface VisitorRequestView extends MyRequest {
  requesterName: string;
  requesterTimezone: string | null;
  holdExpiresAt: string | null;
}

const KEY = ["one-on-one-public"] as const;

export function usePublicHosts() {
  return useQuery({
    queryKey: [...KEY, "hosts"],
    queryFn: () => api.get<HostSummary[]>("/public/one-on-one/hosts"),
  });
}

/** The general page's sessions and times, with no pastor named. */
export function usePublicIntake() {
  return useQuery({
    queryKey: [...KEY, "intake"],
    queryFn: async () => {
      const data = await api.get<HostSummary | { unavailable: true }>("/public/one-on-one/intake");
      return "unavailable" in data ? null : data;
    },
  });
}

export function usePublicSlots(hostId: string | null, sessionTypeId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: [...KEY, "slots", hostId, sessionTypeId, from, to],
    queryFn: () => api.get<SlotDay[]>(`/public/one-on-one/hosts/${hostId}/slots`, { sessionTypeId, from, to }),
    enabled: Boolean(hostId && sessionTypeId),
  });
}

export function useCreateVisitorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VisitorRequestInput) => api.post<{ status: "HOLD" }>("/public/one-on-one/requests", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

const requestKey = (token: string) => [...KEY, "request", token] as const;

export function useVisitorRequest(token: string) {
  return useQuery({
    queryKey: requestKey(token),
    queryFn: () => api.get<VisitorRequestView>(`/public/one-on-one/requests/${encodeURIComponent(token)}`),
    retry: false,
  });
}

function useTokenAction(token: string, action: "confirm" | "cancel" | "accept-proposal") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) =>
      api.post<VisitorRequestView>(`/public/one-on-one/requests/${encodeURIComponent(token)}/${action}`, reason ? { note: reason } : {}),
    onSuccess: (data) => qc.setQueryData(requestKey(token), data),
  });
}

export const useConfirmVisitorRequest = (token: string) => useTokenAction(token, "confirm");
export const useCancelVisitorRequest = (token: string) => useTokenAction(token, "cancel");
export const useAcceptVisitorProposal = (token: string) => useTokenAction(token, "accept-proposal");

export function visitorIcsHref(token: string): string {
  return `/api/backend/public/one-on-one/requests/${encodeURIComponent(token)}/calendar.ics`;
}
