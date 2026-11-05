"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export type HostAccess = "OWNER" | "DELEGATE" | "SUPER_ADMIN";

export interface ManageContext {
  hosts: { hostId: string; displayName: string; access: HostAccess }[];
  canSetUp: boolean;
}

export interface WeeklyWindow {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface SessionType {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  visitorsCanBook: boolean;
  askTopic: boolean;
  jointWithHostId: string | null;
  active: boolean;
}

export interface HostDetail {
  id: string;
  displayName: string;
  slug: string | null;
  defaultMeetingLink: string | null;
  /** Receives the requests made on the general public page, where no pastor is named. */
  publicIntake: boolean;
  canSetPublicIntake: boolean;
  googleConnected: boolean;
  notesEnabled: boolean;
  title: string | null;
  bio: string | null;
  active: boolean;
  bufferMinutes: number;
  dailyCap: number;
  minNoticeHours: number;
  horizonDays: number;
  visitorsAllowed: boolean;
  visitorWeeklyCap: number;
  canAppointDelegates: boolean;
  rules: (WeeklyWindow & { id: string })[];
  blocks: { id: string; date: string; note: string | null }[];
  sessionTypes: SessionType[];
  delegates: { id: string; profileId: string; name: string; email: string | null }[];
}

export type HostSettingsInput = Partial<
  Pick<
    HostDetail,
    | "displayName"
    | "slug"
    | "defaultMeetingLink"
    | "publicIntake"
    | "title"
    | "bio"
    | "active"
    | "bufferMinutes"
    | "dailyCap"
    | "minNoticeHours"
    | "horizonDays"
    | "visitorsAllowed"
    | "visitorWeeklyCap"
  >
>;

export interface SlotDay {
  date: string;
  slots: { startsAt: string; endsAt: string }[];
}

export interface PersonResult {
  profileId: string;
  name: string;
  email: string | null;
}

export interface HostSummary {
  id: string;
  slug: string | null;
  displayName: string;
  title: string | null;
  bio: string | null;
  sessionTypes: { id: string; slug: string | null; name: string; description: string | null; durationMinutes: number; joint: boolean; askTopic: boolean }[];
  nextOpening: string | null;
  notesEnabled: boolean;
}

export type RequestStatus = "HOLD" | "PENDING" | "PROPOSED" | "APPROVED" | "DECLINED" | "CANCELLED" | "LAPSED" | "COMPLETED";
export type MeetingFormat = "IN_PERSON" | "GOOGLE_MEET" | "PHONE";

export const SESSION_TOPICS = ["Counsel", "Prayer", "Marriage & family", "Career & direction", "Spiritual growth", "Something else"] as const;
export type SessionTopic = (typeof SESSION_TOPICS)[number];

export interface SessionRequest {
  id: string;
  status: RequestStatus;
  hostId: string;
  hostName: string;
  coHostName: string | null;
  sessionTypeId: string;
  sessionTypeName: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  proposedStartsAt: string | null;
  proposedEndsAt: string | null;
  /** Null until the pastor decides how to meet. */
  format: MeetingFormat | null;
  topic: string | null;
  decisionNote: string | null;
  meetLink: string | null;
  cancelledBy: "REQUESTER" | "HOST" | null;
  createdAt: string;
}

export interface MyRequest extends SessionRequest {
  canCancel: boolean;
}

export interface HostRequest extends SessionRequest {
  requesterType: "MEMBER" | "VISITOR";
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterLocation: string | null;
  foundVia: string | null;
  hasNote: boolean;
  /** Made on the nameless public page. */
  viaPublicPage: boolean;
  /** Passed on from another pastor. */
  assigned: boolean;
  note: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
}

export interface HostRequests {
  waiting: HostRequest[];
  awaitingRequester: HostRequest[];
  upcoming: HostRequest[];
  cancelled: HostRequest[];
  past: HostRequest[];
}

export interface CreateRequestInput {
  hostId: string;
  sessionTypeId: string;
  startsAt: string;
  format?: MeetingFormat;
  topic?: SessionTopic;
  note?: string;
}

// ── Keys ─────────────────────────────────────────────────────────────────────

const KEY = ["one-on-one"] as const;
const hostKey = (hostId: string) => [...KEY, "manage", "host", hostId] as const;

// ── Members ──────────────────────────────────────────────────────────────────

export function useHosts() {
  return useQuery({
    queryKey: [...KEY, "hosts"],
    queryFn: () => api.get<HostSummary[]>("/one-on-one/hosts"),
  });
}

export function useSlots(hostId: string | null, sessionTypeId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: [...KEY, "slots", hostId, sessionTypeId, from, to],
    queryFn: () => api.get<SlotDay[]>(`/one-on-one/hosts/${hostId}/slots`, { sessionTypeId, from, to }),
    enabled: Boolean(hostId && sessionTypeId),
  });
}

const MINE_KEY = [...KEY, "mine"] as const;

export function useMyRequests() {
  return useQuery({
    queryKey: MINE_KEY,
    queryFn: () => api.get<MyRequest[]>("/one-on-one/requests/mine"),
  });
}

/** After any change to a request, the list, open times and pastor cards may all have moved. */
function useInvalidateMine() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: MINE_KEY });
    qc.invalidateQueries({ queryKey: [...KEY, "slots"] });
    qc.invalidateQueries({ queryKey: [...KEY, "hosts"] });
  };
}

export function useCreateRequest() {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: (input: CreateRequestInput) => api.post<MyRequest>("/one-on-one/requests", input),
    onSuccess: invalidate,
  });
}

export function useCancelMyRequest() {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post<MyRequest>(`/one-on-one/requests/${id}/cancel`, { note: reason }),
    onSuccess: invalidate,
  });
}

export function useAcceptProposal() {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: (id: string) => api.post<MyRequest>(`/one-on-one/requests/${id}/accept-proposal`),
    onSuccess: invalidate,
  });
}

// ── Pastor and delegate decisions ────────────────────────────────────────────

const hostRequestsKey = (hostId: string) => [...KEY, "manage", "requests", hostId] as const;

export function useHostRequests(hostId: string | null) {
  return useQuery({
    queryKey: hostRequestsKey(hostId ?? ""),
    queryFn: () => api.get<HostRequests>(`/one-on-one/manage/hosts/${hostId}/requests`),
    enabled: Boolean(hostId),
    refetchInterval: 60_000,
  });
}

function useDecision<TInput extends { id: string }>(hostId: string, action: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: TInput) => api.post<SessionRequest>(`/one-on-one/manage/hosts/${hostId}/requests/${id}/${action}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostRequestsKey(hostId) });
      qc.invalidateQueries({ queryKey: [...KEY, "manage", "preview", hostId] });
    },
  });
}

export const useApproveRequest = (hostId: string) =>
  useDecision<{ id: string; format: MeetingFormat; note?: string; meetLink?: string }>(hostId, "approve");
export const useSetMeetingLink = (hostId: string) => useDecision<{ id: string; meetLink: string }>(hostId, "link");

/** The download goes through the same-origin API proxy, so the session cookie comes with it. */
export function sessionIcsHref(id: string): string {
  return `/api/backend/one-on-one/requests/${id}/calendar.ics`;
}

export const useAssignRequest = (hostId: string) => useDecision<{ id: string; toHostId: string; note?: string }>(hostId, "assign");

/** Public share link for a pastor's list of sessions, or straight to one of them. */
export function shareUrl(slug: string, sessionSlug?: string | null): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.everlastinghills.church";
  return `${origin}/talk-to-a-pastor/${slug}${sessionSlug ? `/${sessionSlug}` : ""}`;
}
export const useDeclineRequest = (hostId: string) => useDecision<{ id: string; note?: string }>(hostId, "decline");
export const useProposeTime = (hostId: string) =>
  useDecision<{ id: string; startsAt: string; format: MeetingFormat; note?: string }>(hostId, "propose");
export const useCancelApproved = (hostId: string) => useDecision<{ id: string; note?: string }>(hostId, "cancel");

// ── Manage ───────────────────────────────────────────────────────────────────

export function useManageContext() {
  return useQuery({
    queryKey: [...KEY, "manage", "context"],
    queryFn: () => api.get<ManageContext>("/one-on-one/manage/context"),
  });
}

export function useSetUpMyHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<HostDetail>("/one-on-one/manage/hosts/me"),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "manage"] }),
  });
}

export function useHostDetail(hostId: string | null) {
  return useQuery({
    queryKey: hostKey(hostId ?? ""),
    queryFn: () => api.get<HostDetail>(`/one-on-one/manage/hosts/${hostId}`),
    enabled: Boolean(hostId),
  });
}

/** Every manage mutation returns the fresh host, so the cache is set directly rather than refetched. */
function useHostMutation<TInput>(hostId: string, request: (input: TInput) => Promise<HostDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (host) => {
      qc.setQueryData(hostKey(hostId), host);
      qc.invalidateQueries({ queryKey: [...KEY, "manage", "preview", hostId] });
      qc.invalidateQueries({ queryKey: [...KEY, "manage", "context"] });
    },
  });
}

export function useUpdateHostSettings(hostId: string) {
  return useHostMutation(hostId, (input: HostSettingsInput) => api.patch<HostDetail>(`/one-on-one/manage/hosts/${hostId}`, input));
}

export function useReplaceRules(hostId: string) {
  return useHostMutation(hostId, (rules: WeeklyWindow[]) =>
    api.put<HostDetail>(`/one-on-one/manage/hosts/${hostId}/rules`, { rules }),
  );
}

export function useAddBlock(hostId: string) {
  return useHostMutation(hostId, (input: { date: string; note?: string }) =>
    api.post<HostDetail>(`/one-on-one/manage/hosts/${hostId}/blocks`, input),
  );
}

export function useRemoveBlock(hostId: string) {
  return useHostMutation(hostId, (blockId: string) => api.delete<HostDetail>(`/one-on-one/manage/hosts/${hostId}/blocks/${blockId}`));
}

export function useCreateSessionType(hostId: string) {
  return useHostMutation(
    hostId,
    (input: { name: string; durationMinutes: number; description?: string; visitorsCanBook?: boolean; jointWithHostId?: string }) =>
      api.post<HostDetail>(`/one-on-one/manage/hosts/${hostId}/session-types`, input),
  );
}

export function useUpdateSessionType(hostId: string) {
  return useHostMutation(hostId, ({ id, ...input }: Partial<SessionType> & { id: string }) =>
    api.patch<HostDetail>(`/one-on-one/manage/hosts/${hostId}/session-types/${id}`, input),
  );
}

export function useDeleteSessionType(hostId: string) {
  return useHostMutation(hostId, (id: string) => api.delete<HostDetail>(`/one-on-one/manage/hosts/${hostId}/session-types/${id}`));
}

export function useAddDelegate(hostId: string) {
  return useHostMutation(hostId, (profileId: string) =>
    api.post<HostDetail>(`/one-on-one/manage/hosts/${hostId}/delegates`, { profileId }),
  );
}

export function useRemoveDelegate(hostId: string) {
  return useHostMutation(hostId, (delegateId: string) =>
    api.delete<HostDetail>(`/one-on-one/manage/hosts/${hostId}/delegates/${delegateId}`),
  );
}

export function usePeopleSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: [...KEY, "manage", "people", term],
    queryFn: () => api.get<PersonResult[]>("/one-on-one/manage/people", { q: term }),
    enabled: term.length >= 2,
    staleTime: 30_000,
  });
}

export function usePreviewSlots(hostId: string, sessionTypeId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: [...KEY, "manage", "preview", hostId, sessionTypeId, from, to],
    queryFn: () => api.get<SlotDay[]>(`/one-on-one/manage/hosts/${hostId}/preview`, { sessionTypeId, from, to }),
    enabled: Boolean(sessionTypeId),
  });
}
