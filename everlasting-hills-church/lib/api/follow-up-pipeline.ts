"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApiError } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type {
  ContactMethod,
  ContactOutcome,
  FollowUpEntry,
  FollowUpOutcome,
  FollowUpSourceType,
  FollowUpStage,
  PersonRef,
} from "@/types/follow-up";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Church-wide by default — every unit member sees the same entries and totals.
 * Pass unitId to narrow to one team. */
export function useFollowUpEntries(opts: { unitId?: string; stage?: FollowUpStage; mine?: boolean } = {}) {
  return useQuery({
    queryKey: ["follow-up", "list", opts.unitId ?? null, opts.stage ?? null, !!opts.mine],
    queryFn: () =>
      api.get<FollowUpEntry[]>("/follow-up", {
        unitId: opts.unitId,
        stage: opts.stage,
        mine: opts.mine ? "true" : undefined,
      }),
    enabled: typeof window !== "undefined",
  });
}

/** Whether the caller can view the Follow-Up pipeline at all — on a team, or
 * ADMIN+. Used to decide whether to show the nav link. */
export function useFollowUpAccess() {
  return useQuery({
    queryKey: ["follow-up", "access"],
    queryFn: () => api.get<{ hasAccess: boolean }>("/follow-up/access"),
    enabled: typeof window !== "undefined",
    staleTime: 5 * 60_000,
  });
}

export function useFollowUpCandidates(type: FollowUpSourceType, q: string) {
  return useQuery({
    queryKey: ["follow-up", "candidates", type, q],
    queryFn: () => api.get<PersonRef[]>("/follow-up/candidates", { type, q }),
    enabled: q.trim().length >= 2,
  });
}

export function useFollowUpTeam(unitId?: string) {
  return useQuery({
    queryKey: ["follow-up", "team", unitId ?? null],
    queryFn: () => api.get<(PersonRef & { isLead: boolean })[]>("/follow-up/team", unitId ? { unitId } : undefined),
    enabled: typeof window !== "undefined",
  });
}

// ── Mutations — every one toasts on success and on failure ─────────────────────

export function useAddFollowUpEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      unitId?: string;
      sourceType: FollowUpSourceType;
      memberId?: string;
      visitorId?: string;
      assigneeId?: string;
    }) => api.post<FollowUpEntry>("/follow-up", body),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`${entry.person.name} added to the Master List`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't add to the Master List")),
  });
}

export function useAssignFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      api.patch<FollowUpEntry>(`/follow-up/${id}/assign`, { assigneeId }),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`Assigned to ${entry.assignee?.name ?? "team member"}`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't assign")),
  });
}

export function useLogFollowUpContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method, outcome, note }: { id: string; method: ContactMethod; outcome: ContactOutcome; note: string }) =>
      api.post<FollowUpEntry>(`/follow-up/${id}/logs`, { method, outcome, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success("Contact logged");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't log this contact")),
  });
}

/** Logs a final outcome — available to a team lead any time, not gated behind the
 * assignee requesting review (follow-up is continuous, not a queue with a hand-off). */
export function useConfirmFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, outcome, note }: { id: string; outcome: FollowUpOutcome; note?: string }) =>
      api.patch<FollowUpEntry>(`/follow-up/${id}/confirm`, { outcome, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success("Outcome logged");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't log this outcome")),
  });
}

export function useOptOutFollowUpMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<FollowUpEntry>(`/follow-up/${id}/opt-out`),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`${entry.person.name} opted out — they can no longer sign in`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't opt this member out")),
  });
}

export function useRestoreFollowUpMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<FollowUpEntry>(`/follow-up/${id}/restore`),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`${entry.person.name} restored — they can sign in again`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't restore this member")),
  });
}
