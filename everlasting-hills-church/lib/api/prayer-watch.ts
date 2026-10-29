"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PublicSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  spotsLeft: number;
}

export interface PublicWatch {
  id: string;
  title: string;
  watchDate: string;
  slots: PublicSlot[];
}

export type SignupStatus = "PENDING" | "CONFIRMED" | "REMOVED";

export interface AdminSignup {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  isWorker: boolean;
  createdAt: string;
}

export interface AdminSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  spotsLeft: number;
  leaderId: string | null;
  whatsappLink: string | null;
  signups: AdminSignup[];
}

export interface AdminWatch {
  id: string;
  title: string;
  watchDate: string;
  /** The central Telegram channel where the prayer itself happens. */
  telegramLink: string | null;
  slots: AdminSlot[];
}

export interface PendingSignup {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  isWorker: boolean;
  createdAt: string;
  slotId: string;
  slotLabel: string;
  slotTime: string;
}

export interface SignupListRow {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  isWorker: boolean;
  isLeader: boolean;
  createdAt: string;
  slotId: string;
  slotLabel: string;
  slotTime: string;
}

export interface SignupInput {
  slotId: string;
  fullName: string;
  phone: string;
  email: string;
  isWorker: boolean;
}

/** The slot returned once a sign-up is confirmed — includes its WhatsApp
 * group, which is withheld from the public view until then. */
export interface ConfirmedSlot extends PublicSlot {
  whatsappLink: string | null;
}

export interface MySignup {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  isWorker: boolean;
  status: SignupStatus;
  createdAt: string;
}

export interface MySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  /** Null until the sign-up is confirmed. */
  whatsappLink: string | null;
}

export interface PendingFamilyChangeRequest {
  id: string;
  toSlotId: string;
  toSlotLabel: string;
  toSlotTime: string;
  reason: string | null;
  createdAt: string;
}

export interface MySignupView {
  signup: MySignup;
  slot: MySlot;
  /** The central Telegram channel where the prayer happens. Null until confirmed. */
  telegramLink: string | null;
  pendingFamilyChangeRequest: PendingFamilyChangeRequest | null;
}

export interface AdminFamilyChangeRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  fullName: string;
  fromSlotLabel: string;
  fromSlotTime: string;
  toSlotLabel: string;
  toSlotTime: string;
  reason: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface SlotCompanions {
  count: number;
  firstNames: string[];
}

export interface AdminReflection {
  id: string;
  body: string;
  createdAt: string;
  fullName: string;
  watchTitle: string;
  watchDate: string;
  slotLabel: string;
  slotTime: string;
}

export interface ReflectionEntry {
  id: string;
  body: string;
  createdAt: string;
}

export interface PastWatch {
  signupId: string;
  watchTitle: string;
  watchDate: string;
  slotLabel: string;
  slotTime: string;
  reflections: ReflectionEntry[];
}

const PRAYER_WATCH_KEY = ["prayer-watch"] as const;

function useInvalidatePrayerWatch() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PRAYER_WATCH_KEY });
}

// ── Public ───────────────────────────────────────────────────────────────────

export function usePublicPrayerWatch() {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "public"],
    queryFn: () => api.get<PublicWatch>("/prayer-watch/current"),
  });
}

export function useSubmitPrayerSignup() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: (data: SignupInput) => api.post<{ signup: AdminSignup; slot: ConfirmedSlot }>("/prayer-watch/signup", data),
    onSuccess: invalidate,
  });
}

// ── Mine (self-service) ─────────────────────────────────────────────────────

/** Needs auth — pass `enabled: false` on a page a signed-out visitor can reach (this defaults to
 *  true since every existing caller lives inside the authenticated dashboard). */
export function useMyPrayerSignup(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "mine"],
    queryFn: () => api.get<MySignupView | null>("/prayer-watch/mine"),
    enabled: options.enabled ?? true,
  });
}

export function useMyPrayerHistory() {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "mine", "history"],
    queryFn: () => api.get<PastWatch[]>("/prayer-watch/mine/history"),
  });
}

export function useSlotCompanions(slotId: string | null) {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "companions", slotId],
    queryFn: () => api.get<SlotCompanions>(`/prayer-watch/slots/${slotId}/companions`),
    enabled: Boolean(slotId),
  });
}

/** Submits a request to change Prayer Watchmen Family — reviewed by an admin, not applied instantly. */
export function useRequestFamilyChange() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: ({ id, toSlotId, reason }: { id: string; toSlotId: string; reason?: string }) =>
      api.post<PendingFamilyChangeRequest>(`/prayer-watch/mine/${id}/family-change-request`, { toSlotId, reason }),
    onSuccess: invalidate,
  });
}

/** Adds a new dated entry — the watch is ongoing, so a member may log several over time rather than overwrite the last. */
export function useAddReflection() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post<ReflectionEntry>(`/prayer-watch/mine/${id}/reflections`, { body }),
    onSuccess: invalidate,
  });
}

/** Backend route a signed-in browser can hit directly (the proxy attaches auth from the session cookie). */
export function myPrayerWatchIcsHref(signupId: string) {
  return `/api/backend/prayer-watch/mine/${signupId}.ics`;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function useAdminPrayerWatch() {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "admin"],
    queryFn: () => api.get<AdminWatch>("/prayer-watch/admin"),
  });
}

export function usePrayerSignupList() {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "admin", "signups"],
    queryFn: () => api.get<SignupListRow[]>("/prayer-watch/admin/signups"),
  });
}

export function usePendingSignups() {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "admin", "signups", "pending"],
    queryFn: () => api.get<PendingSignup[]>("/prayer-watch/admin/signups/pending"),
  });
}

export function useDecideSignup() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      api.post(`/prayer-watch/admin/signups/${id}/${approve ? "approve" : "decline"}`, { note }),
    onSuccess: invalidate,
  });
}

/** An empty string clears the central Telegram channel. */
export function useSetTelegramLink() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: (telegramLink: string) => api.patch<AdminWatch>("/prayer-watch/admin", { telegramLink }),
    onSuccess: invalidate,
  });
}

export function useAdminReflections() {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "admin", "reflections"],
    queryFn: () => api.get<AdminReflection[]>("/prayer-watch/admin/reflections"),
  });
}

export function useRemoveAdminReflection() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/prayer-watch/admin/reflections/${id}`),
    onSuccess: invalidate,
  });
}

export function useFamilyChangeRequests(filter: "PENDING" | "DECIDED" = "PENDING") {
  return useQuery({
    queryKey: [...PRAYER_WATCH_KEY, "admin", "family-change-requests", filter],
    queryFn: () => api.get<AdminFamilyChangeRequest[]>(`/prayer-watch/admin/family-change-requests?status=${filter}`),
  });
}

export function useDecideFamilyChange() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      api.post(`/prayer-watch/admin/family-change-requests/${id}/${approve ? "approve" : "decline"}`, { note }),
    onSuccess: invalidate,
  });
}

export function useRemovePrayerSignup() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/prayer-watch/admin/signups/${id}`),
    onSuccess: invalidate,
  });
}

/** signupId must be one of that slot's own sign-ups; null clears the leader. */
export function useSetSlotLeader() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: ({ slotId, signupId }: { slotId: string; signupId: string | null }) =>
      api.patch<AdminWatch>(`/prayer-watch/admin/slots/${slotId}/leader`, { signupId }),
    onSuccess: invalidate,
  });
}

/** An empty string clears the slot's WhatsApp group. */
export function useSetSlotWhatsappLink() {
  const invalidate = useInvalidatePrayerWatch();
  return useMutation({
    mutationFn: ({ slotId, whatsappLink }: { slotId: string; whatsappLink: string }) =>
      api.patch<AdminWatch>("/prayer-watch/admin", { slots: [{ id: slotId, whatsappLink }] }),
    onSuccess: invalidate,
  });
}
