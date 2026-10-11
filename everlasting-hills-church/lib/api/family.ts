"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type MaritalStatus = "SINGLE" | "MARRIED";

export interface FamilyPerson {
  id: string;
  name: string;
  photoUrl: string | null;
}

/** My marital status, my spouse once they have agreed, and requests either way. */
export interface MySpouse {
  maritalStatus: MaritalStatus;
  spouse: FamilyPerson | null;
  spouseName: string | null;
  pendingSent: { id: string; createdAt: string; to: FamilyPerson } | null;
  pendingReceived: { id: string; createdAt: string; from: FamilyPerson }[];
}

export interface FamilyDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  units: string[];
}

export interface FamilyDirectoryPage {
  items: FamilyDirectoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

type DayMonth = { day: number; month: number };

/** A member's profile as the church family sees it: no phone, email or address. */
export interface FamilyProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  bio: string | null;
  gender: string | null;
  joinedAt: string;
  birthday: DayMonth | null;
  maritalStatus: MaritalStatus;
  anniversary: DayMonth | null;
  spouse: FamilyPerson | null;
  spouseName: string | null;
  socials: {
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    linkedin: string | null;
    tiktok: string | null;
  };
  units: { id: string; name: string; description: string | null; isLead: boolean; isAssistant: boolean }[];
}

const SPOUSE_KEY = ["members", "me", "spouse"] as const;

export function useMySpouse() {
  return useQuery({
    queryKey: SPOUSE_KEY,
    queryFn: () => api.get<MySpouse>("/members/me/spouse"),
  });
}

function useSpouseMutation<TArg>(fn: (arg: TArg) => Promise<MySpouse>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      client.setQueryData(SPOUSE_KEY, data);
      client.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useRequestSpouse() {
  return useSpouseMutation((memberId: string) => api.post<MySpouse>("/members/me/spouse-requests", { memberId }));
}

export function useCancelSpouseRequest() {
  return useSpouseMutation<void>(() => api.delete<MySpouse>("/members/me/spouse-requests"));
}

export function useRespondToSpouse() {
  return useSpouseMutation(({ id, accept }: { id: string; accept: boolean }) =>
    api.post<MySpouse>(`/members/me/spouse-requests/${id}/${accept ? "accept" : "decline"}`, {}),
  );
}

export function useUnlinkSpouse() {
  return useSpouseMutation<void>(() => api.delete<MySpouse>("/members/me/spouse"));
}

export function useFamilyDirectory(q: string, page: number) {
  return useQuery({
    queryKey: ["members", "family", q.trim().toLowerCase(), page],
    queryFn: () => api.get<FamilyDirectoryPage>("/members/family", { q: q.trim() || undefined, page }),
    placeholderData: keepPreviousData,
  });
}

export function useFamilyProfile(id: string) {
  return useQuery({
    queryKey: ["members", "family", "profile", id],
    queryFn: () => api.get<FamilyProfile>(`/members/${id}/profile`),
  });
}
