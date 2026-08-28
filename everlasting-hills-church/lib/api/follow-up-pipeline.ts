"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApiError } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type {
  ContactLogKind,
  ContactMethod,
  ContactOutcome,
  FollowUpConnection,
  FollowUpEntry,
  FollowUpEntryDetail,
  FollowUpOutcome,
  FollowUpSourceType,
  FollowUpStage,
  LeaderboardResponse,
  PersonRef,
  ServiceReportDraft,
  ServiceReportHistoryRow,
  ServiceReportRecipientGroup,
  ServiceReportSentVia,
  WinItem,
} from "@/types/follow-up";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Church-wide by default — every unit member sees the same entries and totals.
 * Pass unitId to narrow to one team, serviceId to narrow to one service day.
 * Pass pastoral: true to fetch only entries sent to the pastor (Pastor Follow-Ups page). */
export function useFollowUpEntries(
  opts: { unitId?: string; stage?: FollowUpStage; mine?: boolean; serviceId?: string; pastoral?: boolean } = {}
) {
  return useQuery({
    queryKey: [
      "follow-up",
      "list",
      opts.unitId ?? null,
      opts.stage ?? null,
      !!opts.mine,
      opts.serviceId ?? null,
      !!opts.pastoral,
    ],
    queryFn: () =>
      api.get<FollowUpEntry[]>("/follow-up", {
        unitId: opts.unitId,
        stage: opts.stage,
        mine: opts.mine ? "true" : undefined,
        serviceId: opts.serviceId,
        pastoral: opts.pastoral ? "true" : undefined,
      }),
    enabled: typeof window !== "undefined",
  });
}

/** Single-entry detail — the only response that includes `bestTimeHint`. Used by
 * the drawer to enrich the already-loaded list row once it's open. */
export function useFollowUpEntryDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ["follow-up", "detail", id ?? null],
    queryFn: () => api.get<FollowUpEntryDetail>(`/follow-up/${id}`),
    enabled: !!id,
  });
}

export interface FollowUpServiceOption {
  id: string;
  name: string;
  scheduledAt: string;
  serviceType: string;
}

/** Recent services, for the service-day filter. */
export function useFollowUpServices() {
  return useQuery({
    queryKey: ["follow-up", "services"],
    queryFn: () => api.get<FollowUpServiceOption[]>("/follow-up/services"),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
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

/** Suggested/introduced/connected/declined connections for one entry. Calling
 * this also refreshes/computes suggestions server-side — no separate action. */
export function useFollowUpConnections(entryId: string | null | undefined) {
  return useQuery({
    queryKey: ["follow-up", "connections", entryId ?? null],
    queryFn: () => api.get<FollowUpConnection[]>(`/follow-up/${entryId}/connections`),
    enabled: !!entryId,
  });
}

export function useFollowUpWins() {
  return useQuery({
    queryKey: ["follow-up", "wins"],
    queryFn: () => api.get<WinItem[]>("/follow-up/wins"),
    enabled: typeof window !== "undefined",
  });
}

export function useFollowUpLeaderboard(period: "week" | "month") {
  return useQuery({
    queryKey: ["follow-up", "leaderboard", period],
    queryFn: () => api.get<LeaderboardResponse>("/follow-up/leaderboard", { period }),
    enabled: typeof window !== "undefined",
  });
}

export function useServiceReportHistory(unitId?: string) {
  return useQuery({
    queryKey: ["follow-up", "service-reports", "history", unitId ?? null],
    queryFn: () => api.get<ServiceReportHistoryRow[]>("/follow-up/service-reports", unitId ? { unitId } : undefined),
    enabled: typeof window !== "undefined",
  });
}

export function useServiceReportDraft(serviceId?: string, unitId?: string) {
  return useQuery({
    queryKey: ["follow-up", "service-reports", "draft", serviceId ?? null, unitId ?? null],
    queryFn: () => api.get<ServiceReportDraft>(`/follow-up/service-reports/${serviceId}/${unitId}/draft`),
    enabled: !!serviceId && !!unitId,
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
    mutationFn: ({
      id, method, outcome, note, kind, isPastoralContact, isPrivate,
    }: {
      id: string;
      note: string;
      method?: ContactMethod;
      outcome?: ContactOutcome;
      kind?: ContactLogKind;
      isPastoralContact?: boolean;
      isPrivate?: boolean;
    }) => api.post<FollowUpEntry>(`/follow-up/${id}/logs`, { method, outcome, note, kind, isPastoralContact, isPrivate }),
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
      qc.invalidateQueries({ queryKey: ["follow-up", "wins"] });
      qc.invalidateQueries({ queryKey: ["follow-up", "leaderboard"] });
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

export function useSnoozeFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until?: string | null }) =>
      api.patch<FollowUpEntry>(`/follow-up/${id}/snooze`, { until: until ?? null }),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(entry.snoozedUntil ? "Snoozed" : "Un-snoozed");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't update the snooze")),
  });
}

export function useSendToPastor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ entry: FollowUpEntry; whatsappLink: string | null }>(`/follow-up/${id}/send-to-pastor`),
    onSuccess: ({ entry }) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`Sent ${entry.person.name} to the Pastor`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't send to the Pastor")),
  });
}

export function useIntroduceConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, connectionId }: { entryId: string; connectionId: string }) =>
      api.post<FollowUpEntry>(`/follow-up/${entryId}/connections/${connectionId}/introduce`),
    onSuccess: (_entry, { entryId }) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      qc.invalidateQueries({ queryKey: ["follow-up", "connections", entryId] });
      showToast.success("Introduction made");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't make the introduction")),
  });
}

export function useUpdateConnectionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId, connectionId, status,
    }: { entryId: string; connectionId: string; status: "CONNECTED" | "DECLINED" }) =>
      api.patch<FollowUpEntry>(`/follow-up/${entryId}/connections/${connectionId}`, { status }),
    onSuccess: (_entry, { entryId, status }) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      qc.invalidateQueries({ queryKey: ["follow-up", "connections", entryId] });
      qc.invalidateQueries({ queryKey: ["follow-up", "wins"] });
      qc.invalidateQueries({ queryKey: ["follow-up", "leaderboard"] });
      showToast.success(status === "CONNECTED" ? "Marked as connected" : "Marked as didn't work out");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't update this connection")),
  });
}

export function useQuickCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { firstName: string; lastName: string; phone: string; serviceId?: string }) =>
      api.post<FollowUpEntry>("/follow-up/quick-capture", body),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`${entry.person.name} captured — added to the pipeline`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't capture this visitor")),
  });
}

export function useBulkReassign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { unitId: string; fromAssigneeId: string; toAssigneeId: string }) =>
      api.patch<{ reassigned: number }>("/follow-up/bulk-reassign", body),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`${result.reassigned} ${result.reassigned === 1 ? "entry" : "entries"} reassigned`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't bulk reassign")),
  });
}

/** On-demand backfill for one past service day — surfaces whoever was absent
 * from it and any still-unconverted first-timers from it, even if the daily
 * sweep never covered that far back. Use when a service-day filter comes back
 * empty and you know there should be people there. */
export function useBackfillFollowUpService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<{ absenteesCreated: number; firstTimersCreated: number }>(`/follow-up/services/${serviceId}/backfill`),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      const total = result.absenteesCreated + result.firstTimersCreated;
      showToast.success(
        total === 0
          ? "Nothing to add — everyone was already on the Master List"
          : `Added ${total} ${total === 1 ? "entry" : "entries"} for this service`,
      );
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't generate entries for this service")),
  });
}

export function useSendServiceReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId, unitId, summaryText, sentVia, recipients,
    }: {
      serviceId: string;
      unitId: string;
      summaryText: string;
      sentVia?: ServiceReportSentVia;
      recipients?: ServiceReportRecipientGroup[];
    }) =>
      api.post<{ report: ServiceReportHistoryRow; whatsappLink: string | null }>(
        `/follow-up/service-reports/${serviceId}/${unitId}/send`,
        { summaryText, sentVia, recipients },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-up", "service-reports"] });
      showToast.success("Report sent");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't send this report")),
  });
}
