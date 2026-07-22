"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface QuestionMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
}

export type QuestionStatus = "PENDING" | "ANSWERED";

export interface QuestionRow {
  id: string;
  question: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
  submittedAt: string;
  status: QuestionStatus;
  /** Set only when the submitter was signed in — present even if isAnonymous,
   * since anonymous only hides the free-text name, never the linked member. */
  member: QuestionMember | null;
}

export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: () => api.get<QuestionRow[]>("/forms/questions"),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/forms/questions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useUpdateQuestionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuestionStatus }) =>
      api.patch(`/forms/questions/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}
