"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface CommunityBirthday {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  daysUntil: number;
}

export interface BirthdayGreeting {
  id: string;
  message: string;
  createdAt: string;
  memberId: string;
  authorMemberId: string;
  Author: { firstName: string; lastName: string; photoUrl: string | null };
}

const KEY = ["members", "birthdays"] as const;

export function useCommunityBirthdays(daysAhead = 7) {
  return useQuery({
    queryKey: [...KEY, "community", daysAhead],
    queryFn: () => api.get<CommunityBirthday[]>("/members/birthdays/community", { daysAhead }),
  });
}

export function useBirthdayGreetings(memberId: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "greetings", memberId],
    queryFn: () => api.get<BirthdayGreeting[]>(`/members/${memberId}/birthday-greetings`),
    enabled: !!memberId,
  });
}

export function useAddBirthdayGreeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, message }: { memberId: string; message: string }) =>
      api.post<BirthdayGreeting>(`/members/me/${memberId}/birthday-greetings`, { message }),
    onSuccess: (_data, { memberId }) => {
      qc.invalidateQueries({ queryKey: [...KEY, "greetings", memberId] });
    },
  });
}

export function useDeleteBirthdayGreeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ greetingId }: { greetingId: string; memberId: string }) =>
      api.delete<{ id: string; deleted: boolean }>(`/members/me/birthday-greetings/${greetingId}`),
    onSuccess: (_data, { memberId }) => {
      qc.invalidateQueries({ queryKey: [...KEY, "greetings", memberId] });
    },
  });
}
