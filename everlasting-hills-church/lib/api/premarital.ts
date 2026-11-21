"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { CaseStatus } from "@/lib/pre-marital/schema";

export type StaffTier = "PASTOR" | "SUPER_ADMIN" | "MINISTRY";
export type Attendance = "UNMARKED" | "BOTH_PRESENT" | "ONE_PRESENT" | "ABSENT";

export interface MarriageAccess {
  tier: StaffTier | null;
  counsellor: boolean;
  /** This person has a pre-marital application of their own (the Pre-marital menu item). */
  couple: boolean;
  can: { triage: boolean; assign: boolean; policy: boolean; settings: boolean; wedding: boolean };
}

export interface Overview {
  total: number; new: number; awaitingReview: number; inCounselling: number; upcomingSessions: number; needsAttention: number; completed: number;
  documentsAwaitingReview: number;
}

export interface CaseSummary {
  id: string; referenceCode: string; applicantFirstName: string; applicantLastName: string; partnerFirstName: string; partnerLastName: string;
  status: CaseStatus; submittedAt: string; weddingDate: string | null; safeguardingFlaggedAt: string | null;
  applicantRole: "GROOM" | "BRIDE" | null;
  counsellors: { name: string | null; isLead: boolean }[];
}

export interface Session {
  id: string; applicationId: string; counsellorProfileId: string; counsellorName: string | null; scheduledAt: string; durationMinutes: number;
  format: "PHYSICAL" | "ONLINE"; location: string | null; meetingLink: string | null; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  attendance: Attendance;
  Application?: { id: string; referenceCode: string; applicantFirstName: string; applicantLastName: string; partnerFirstName: string; partnerLastName: string };
}

export interface CaseDetail extends Omit<CaseSummary, "counsellors"> {
  applicantEmail: string; applicantPhone: string; partnerEmail: string | null; partnerPhone: string | null;
  membership: "BOTH_MEMBERS" | "ONE_MEMBER" | "NEITHER"; preferredContact: "WHATSAPP" | "PHONE_CALL" | "EMAIL"; intro: string | null;
  adminNote?: string | null; archivedAt: string | null; member: { id: string; name: string } | null;
  assignments: { id: string; counsellorProfileId: string; name: string | null; isLead: boolean; active: boolean; assignedAt: string; endedAt: string | null }[];
  sessions: Session[];
  timeline: { id: string; from: CaseStatus | null; to: CaseStatus; reason: string | null; at: string; by: string | null }[];
  WeddingApproval: { approvedAt: string; note: string | null } | null;
  tier: StaffTier | "COUNSELLOR";
  can: { transitions: CaseStatus[]; requestInfo: boolean; admin: boolean; assign: boolean; archive: boolean; safeguarding: boolean; wedding: boolean; sessions: boolean };
  documentsGate: { status: CaseStatus; satisfied: boolean; canOverride: boolean; reasons: { code: string; label: string }[] };
}

export type PolicyKey = "eligibility" | "duration" | "fees" | "counsellors" | "retention" | "privacyNotice";
export type Policy = Record<PolicyKey, { value: string; state: "PENDING_PASTORAL_APPROVAL" | "APPROVED" }>;

const K = ["marriage"] as const;
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""));

export function submitPremaritalApplication(body: object) {
  return api.post<{ referenceCode: string }>("/public/premarital/applications", body);
}

/** Who may use the Marriage section, for the menu. Quiet: anyone signed in may ask. */
export function useMarriageAccess() {
  return useQuery({ queryKey: [...K, "access"], queryFn: () => api.get<MarriageAccess>("/premarital/access"), staleTime: 5 * 60_000 });
}

export const useOverview = () => useQuery({ queryKey: [...K, "overview"], queryFn: () => api.get<Overview>("/premarital/overview") });

export function useCases(q: { status?: string; cursor?: string; storedFiles?: "closed" }) {
  const params = clean(q);
  return useQuery({ queryKey: [...K, "cases", params], queryFn: () => api.get<{ items: CaseSummary[]; nextCursor: string | null }>("/premarital/applications", params) });
}

export const useCase = (id: string) =>
  useQuery({ queryKey: [...K, "case", id], queryFn: () => api.get<CaseDetail>(`/premarital/applications/${id}`), enabled: !!id });

export function useSessions(q: { from?: string; to?: string }) {
  const params = clean(q);
  return useQuery({ queryKey: [...K, "sessions", params], queryFn: () => api.get<Session[]>("/premarital/sessions", params) });
}

export const usePolicy = () => useQuery({ queryKey: [...K, "policy"], queryFn: () => api.get<{ policy: Policy; canEdit: boolean }>("/premarital/settings") });

/** Any change in the Marriage section: send it, then refresh what it touched. */
export function useMarriageAction<T = unknown>() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ method, path, body }: { method: "post" | "patch" | "put" | "delete"; path: string; body?: object }) =>
      (method === "delete" ? api.delete<T>(path) : api[method]<T>(path, body ?? {})),
    onSuccess: () => qc.invalidateQueries({ queryKey: K }),
  });
}
