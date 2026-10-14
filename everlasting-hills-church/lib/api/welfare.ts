"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type WelfareUrgency = "LOW" | "MEDIUM" | "HIGH";
export type WelfareStatus = "PENDING" | "IN_REVIEW" | "RESOLVED" | "DECLINED";

export interface WelfareRequestInput {
  fullName: string;
  phone: string;
  email: string;
  isWorkerInChurch: boolean;
  address: string;
  attendanceLength: string;
  occupation: string;
  /** Free text, what they need help with, in their own words. */
  category: string;
  description: string;
  urgency: WelfareUrgency;
}

export interface WelfareRequestResult {
  success: boolean;
  message: string;
  referenceCode: string;
}

export interface WelfareRequestMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
}

export interface WelfareRequestRow {
  id: string;
  referenceCode: string;
  fullName: string;
  phone: string;
  email: string;
  isWorkerInChurch: boolean;
  address: string;
  attendanceLength: string;
  occupation: string;
  category: string;
  description: string;
  urgency: WelfareUrgency;
  status: WelfareStatus;
  submittedAt: string;
  /** Set only when the submitter was signed in. */
  member: WelfareRequestMember | null;
}

/** Public submission — works with no session; still linked to a member if signed in. */
export function useSubmitWelfareRequest() {
  return useMutation({
    mutationFn: (input: WelfareRequestInput) =>
      api.post<WelfareRequestResult>("/forms/welfare-request", input),
  });
}

/** Admin list, newest first. */
export function useWelfareRequests() {
  return useQuery({
    queryKey: ["welfare-requests"],
    queryFn: () => api.get<WelfareRequestRow[]>("/forms/welfare-requests"),
  });
}

export function useUpdateWelfareRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WelfareStatus }) =>
      api.patch(`/forms/welfare-requests/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["welfare-requests"] }),
  });
}

export function useDeleteWelfareRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/forms/welfare-requests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["welfare-requests"] }),
  });
}
