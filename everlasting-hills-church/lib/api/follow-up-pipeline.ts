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

/** The unit whose leader controls (Team roster, Bulk reassign) the caller should
 * see: their own led/assisted unit, or the "Follow-Up" unit itself for
 * ADMIN+/PASTOR/SUPER_ADMIN with no team of their own — giving them the same
 * access a Follow-Up unit lead has, rather than one only reachable via the API. */
export function useMyFollowUpUnit() {
  return useQuery({
    queryKey: ["follow-up", "my-unit"],
    queryFn: () => api.get<{ id: string; name: string } | null>("/follow-up/my-unit"),
    enabled: typeof window !== "undefined",
    staleTime: 5 * 60_000,
  });
}

/** Whether the caller may see Follow-Up Service Reports: the "Follow-Up" unit,
 * but only for its own lead or PASTOR/ADMIN_HEAD/ADMIN/SUPER_ADMIN — narrower
 * than useMyFollowUpUnit, since a lead of some other team has no reason to see
 * reports about Follow-Up activity specifically. Null hides the Reports tab. */
export function useFollowUpReportsUnit() {
  return useQuery({
    queryKey: ["follow-up", "reports-unit"],
    queryFn: () => api.get<{ id: string; name: string } | null>("/follow-up/reports-unit"),
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
      id, method, outcome, note, kind, serviceId, contactedAt, isPastoralContact, isPrivate,
    }: {
      id: string;
      note: string;
      method?: ContactMethod;
      outcome?: ContactOutcome;
      kind?: ContactLogKind;
      serviceId?: string;
      /** yyyy-MM-dd — only meaningful for a general check-in (no serviceId). */
      contactedAt?: string;
      isPastoralContact?: boolean;
      isPrivate?: boolean;
    }) => api.post<FollowUpEntry>(`/follow-up/${id}/logs`, { method, outcome, note, kind, serviceId, contactedAt, isPastoralContact, isPrivate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success("Activity logged");
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't log this activity")),
  });
}

/** Marks this entry's subject present for a service — for when they showed up
 * but weren't checked in through the normal attendance flow. */
export function useMarkFollowUpPresent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, serviceId }: { id: string; serviceId: string }) =>
      api.post<FollowUpEntry>(`/follow-up/${id}/mark-present`, { serviceId }),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(`Marked ${entry.person.name} present`);
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't mark this person present")),
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

// ── Master list: every church member, with their follow-up status ────────────

export type MasterListStatus =
  | "FIRST_TIMER"
  | "SECOND_TIMER"
  | "THIRD_TIMER"
  | "INTEGRATED"
  | "AWAY"
  | "OPTED_OUT";

export interface MasterListRow {
  /** A status asked for but not yet approved by a leader. */
  statusAwaitingApproval?: MasterListStatus | null;
  /** Member id, or Visitor id for a first-timer with no account yet. */
  id: string;
  kind: "MEMBER" | "VISITOR";
  name: string;
  photoUrl: string | null;
  assignedTo: { id: string; name: string } | null;
  status: MasterListStatus;
  /** False for a first-timer nobody has created an account for yet. */
  hasAccount: boolean;
  /** Services attended — what first/second/third timer is counted from. */
  attended: number;
  /**
   * Missed services out of those held since they joined (past Sundays and
   * Wednesdays where attendance was taken). Null for first-timers without an
   * account, and for members no service has counted for yet.
   */
  absence?: { missed: number; total: number; missedLatest: boolean } | null;
}

export interface MasterListPage {
  data: MasterListRow[];
  meta: {
    total: number;
    take: number;
    skip: number;
    /** How many of the matching people missed `absenceServiceId`. */
    absent: number;
    /** The service `absent` counts: the one filtered on, or else the latest that counts. */
    absenceServiceId: string | null;
  };
}

/** `absentFrom` value for the most recent service that counts for absences. */
export const LATEST_SERVICE = "latest";

export interface MasterListQuery {
  search?: string;
  status?: MasterListStatus | "";
  /** Joined or first came on or after this day. */
  from?: string;
  to?: string;
  /** A member id, or "none" for nobody assigned. */
  assigneeId?: string;
  /**
   * Whose list this is. Follow Up leaves out anyone integrated — that work is
   * finished; the Integration Team takes those people and the ones who have
   * since stopped coming.
   */
  scope?: "FOLLOW_UP" | "INTEGRATION" | "ALL";
  /** A service id, or LATEST_SERVICE: only the members who missed that service. */
  absentFrom?: string;
  take?: number;
  skip?: number;
}

/** Everyone on the church roll, filtered and paged, for the Master list. */
export function useFollowUpMasterList(params: MasterListQuery) {
  const { search = "", status = "", from = "", to = "", assigneeId = "", scope = "ALL", absentFrom = "", take = 50, skip = 0 } =
    params;
  return useQuery({
    queryKey: ["follow-up", "master-list", { search, status, from, to, assigneeId, scope, absentFrom, take, skip }],
    queryFn: () =>
      api.get<MasterListPage>("/follow-up/master-list", {
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(scope !== "ALL" ? { scope } : {}),
        ...(absentFrom ? { absentFrom } : {}),
        take,
        skip,
      }),
    enabled: typeof window !== "undefined",
  });
}

export interface AssigneeLoad {
  memberId: string;
  name: string;
  photoUrl: string | null;
  /** People currently on their plate. */
  count: number;
}

/** How many people each team member is following up — leaders only. */
export function useFollowUpWorkload(enabled: boolean) {
  return useQuery({
    queryKey: ["follow-up", "workload"],
    queryFn: () => api.get<AssigneeLoad[]>("/follow-up/workload"),
    enabled: enabled && typeof window !== "undefined",
  });
}

export interface FollowUpPerson extends MasterListRow {
  /** The follow-up entry to reassign, when one exists. */
  entryId: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  /** First-timers only — what the first-timer form asked them. */
  occupation: string | null;
  invitedBy: string | null;
  howTheyHeard: string | null;
  membershipInterest: string | null;
  prayerPoint: string | null;
  /** Members only. */
  memberSince: string | null;
  /** When they first came to the church's notice. */
  since: string;
}

/** One person from the Master list, in full — for the detail drawer. */
export function useFollowUpPerson(person: { kind: string; id: string } | null) {
  return useQuery({
    queryKey: ["follow-up", "person", person?.kind, person?.id],
    queryFn: () => api.get<FollowUpPerson>(`/follow-up/person/${person?.kind}/${person?.id}`),
    enabled: !!person,
  });
}

// ── Status changes: anyone asks, a unit lead or HOD approves ────────────────

export interface PendingStatusChange {
  id: string;
  subjectKind: string;
  subjectId: string;
  name: string;
  fromStatus: MasterListStatus;
  toStatus: MasterListStatus;
  note: string | null;
  requestedBy: string;
  requestedAt: string;
}

/** Ask for someone's status to be changed; a leader's own ask is approved on sight. */
export function useRequestStatusChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      subjectKind: string;
      subjectId: string;
      fromStatus: MasterListStatus;
      toStatus: MasterListStatus;
      note?: string;
    }) => api.post<{ id: string; state: string }>("/follow-up/status", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-up"] }),
    onError: (err) => showToast.error(errorMessage(err, "Couldn't save that change")),
  });
}

export function usePendingStatusChanges(enabled: boolean) {
  return useQuery({
    queryKey: ["follow-up", "status", "pending"],
    queryFn: () => api.get<PendingStatusChange[]>("/follow-up/status/pending"),
    enabled: enabled && typeof window !== "undefined",
  });
}

export function useDecideStatusChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post<{ id: string; state: string }>(`/follow-up/status/${id}/decide`, { approve }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-up"] }),
    onError: (err) => showToast.error(errorMessage(err, "Couldn't save that change")),
  });
}

// ── The team's conversation about one person ────────────────────────────────

export interface NoteReaction {
  emoji: string;
  count: number;
  /** True when you are one of them. */
  mine: boolean;
  names: string[];
}

export interface FollowUpNote {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: { profileId: string; name: string; photoUrl: string | null };
  reactions: NoteReaction[];
  replies: FollowUpNote[];
  canEdit: boolean;
  canDelete: boolean;
}

export { useFollowUpNotes, useFollowUpNoteActions } from "./follow-up-notes";

