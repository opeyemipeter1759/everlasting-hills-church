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
  signups: AdminSignup[];
}

export interface AdminWatch {
  id: string;
  title: string;
  watchDate: string;
  slots: AdminSlot[];
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
  return useMutation({
    mutationFn: (data: SignupInput) => api.post<{ signup: AdminSignup; slot: PublicSlot }>("/prayer-watch/signup", data),
  });
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
