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
  name: string;
  description: string | null;
  durationMinutes: number;
  visitorsCanBook: boolean;
  jointWithHostId: string | null;
  active: boolean;
}

export interface HostDetail {
  id: string;
  displayName: string;
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
  displayName: string;
  title: string | null;
  bio: string | null;
  sessionTypes: { id: string; name: string; description: string | null; durationMinutes: number; joint: boolean }[];
  nextOpening: string | null;
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
