"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApiError } from "@/lib/api/axios";
import type { PipelineRow } from "@/lib/api/pipeline";
import { showToast } from "@/components/ui/toast/toast";
import type { DecideApprovalInput, RequestApprovalInput } from "@/lib/follow-up/approval-schema";

export type ApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "CANCELLED";
export type DeciderLevel = "LEAD" | "HEAD" | "ADMIN";

export interface ApprovalView {
  id: string;
  kind: string;
  status: ApprovalStatus;
  subjectId: string;
  unitId: string;
  unitName: string | null;
  note: string | null;
  requesterName: string | null;
  createdAt: string;
  decidedAt: string | null;
  deciderName: string | null;
  decisionNote: string | null;
  adminOverride: boolean;
}

/** The approval part of a first-timer's profile, and what the viewer may do. */
export interface SubjectApproval {
  latest: ApprovalView | null;
  canRequest: boolean;
  blocked: string | null;
  deciders: { level: DeciderLevel; names: string[] } | null;
  canDecide: boolean;
  decideAsOverride: boolean;
}

export interface ApprovalQueueItem extends ApprovalView {
  asOverride: boolean;
  person: PipelineRow;
}

export function useSubjectApproval(visitorId: string) {
  return useQuery({
    queryKey: ["follow-up", "approvals", "subject", visitorId],
    queryFn: () => api.get<SubjectApproval>(`/approvals/subject/${visitorId}`),
    enabled: !!visitorId && typeof window !== "undefined",
  });
}

/** Pending requests the viewer may decide, oldest first; one unit's when `unitId` is given. */
export function useApprovalQueue(unitId?: string) {
  return useQuery({
    queryKey: ["follow-up", "approvals", "queue", unitId ?? "all"],
    queryFn: () => api.get<ApprovalQueueItem[]>("/approvals/queue", unitId ? { unitId } : undefined),
    enabled: typeof window !== "undefined",
  });
}

function useApprovalMutation<T>(run: (input: T) => Promise<SubjectApproval>, done: string, failed: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-up"] });
      showToast.success(done);
    },
    onError: (err) => showToast.error((err as ApiError)?.message || failed),
  });
}

export function useRequestApproval() {
  return useApprovalMutation(
    (input: RequestApprovalInput) => api.post<SubjectApproval>("/approvals", input),
    "Approval requested. The unit lead has been told.",
    "Could not ask for approval",
  );
}

export function useDecideApproval() {
  return useApprovalMutation(
    ({ id, ...input }: DecideApprovalInput & { id: string }) => api.post<SubjectApproval>(`/approvals/${id}/decide`, input),
    "Decision saved",
    "Could not save the decision",
  );
}
