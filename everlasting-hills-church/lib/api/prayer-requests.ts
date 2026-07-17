"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface PrayerRequestMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
}

export interface PrayerRequestRow {
  id: string;
  request: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
  submittedAt: string;
  /** Set only when the submitter was signed in — present even if isAnonymous,
   * since anonymous only hides the free-text name, never the linked member. */
  member: PrayerRequestMember | null;
}

export function usePrayerRequests() {
  return useQuery({
    queryKey: ["prayer-requests"],
    queryFn: () => api.get<PrayerRequestRow[]>("/forms/prayer-requests"),
  });
}

export function useDeletePrayerRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/forms/prayer-requests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prayer-requests"] }),
  });
}
