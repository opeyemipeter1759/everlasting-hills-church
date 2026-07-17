"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type ReportScope = "DEPARTMENT" | "UNIT";
export type ReportStatus = "SUBMITTED" | "APPROVED" | "NEEDS_CORRECTION";

export interface ReportPerson {
  profileId: string;
  name: string;
  photoUrl: string | null;
}

export interface ReportRow {
  id: string;
  scope: ReportScope;
  title: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  status: ReportStatus;
  department: { id: string; name: string; code: string } | null;
  unit: { id: string; name: string } | null;
  submittedBy: ReportPerson | null;
  reviewedBy: ReportPerson | null;
  reviewedAt: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportComment {
  id: string;
  content: string;
  author: ReportPerson | null;
  isReviewer: boolean;
  createdAt: string;
}

export interface ReportDetail extends ReportRow {
  comments: ReportComment[];
}

export interface CreateReportInput {
  scope: ReportScope;
  departmentId?: string;
  unitId?: string;
  title: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

const KEY = ["status-reports"] as const;

export function useMyReports() {
  return useQuery({
    queryKey: [...KEY, "mine"],
    queryFn: () => api.get<ReportRow[]>("/status-reports/mine"),
  });
}

export function useAllReports(status?: string) {
  return useQuery({
    queryKey: [...KEY, "all", status],
    queryFn: () => api.get<ReportRow[]>("/status-reports", status ? { status } : undefined),
  });
}

export function useReport(id: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "one", id],
    queryFn: () => api.get<ReportDetail>(`/status-reports/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: CreateReportInput) => api.post<ReportRow>("/status-reports", body),
    onSuccess: invalidate,
  });
}

export function useUpdateReport(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { title: string; content: string; attachmentUrl?: string; attachmentName?: string }) =>
      api.patch<ReportRow>(`/status-reports/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useApproveReport(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api.patch<ReportRow>(`/status-reports/${id}/approve`),
    onSuccess: invalidate,
  });
}

export function useRequestCorrection(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (comment: string) => api.patch<ReportRow>(`/status-reports/${id}/request-correction`, { comment }),
    onSuccess: invalidate,
  });
}

export function useAddReportComment(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (content: string) => api.post<ReportComment>(`/status-reports/${id}/comments`, { content }),
    onSuccess: invalidate,
  });
}
