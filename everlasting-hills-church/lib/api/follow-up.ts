"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FollowUpTaskRow {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  completedAt: string | null;
}

export interface MyShepherdRow {
  id: string;
  note: string | null;
  createdAt: string;
  member: {
    id: string;
    name: string;
    photoUrl: string | null;
    phone: string | null;
  };
  lastAttendedAt: string | null;
  weeksSinceAttended: number | null;
  tasks: FollowUpTaskRow[];
}

export interface AssignmentRow {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  member: { id: string; name: string; photoUrl: string | null };
  leader: { id: string; name: string; photoUrl: string | null };
}

export interface OpenFollowUpRow {
  id: string;
  title: string;
  dueDate: string | null;
  createdAt: string;
  member: { id: string; name: string; photoUrl: string | null; phone: string | null };
  assignedLeaderName: string | null;
}

// ── Unit Lead: my shepherd list ─────────────────────────────────────────────

export function useMyFollowUps() {
  return useQuery({
    queryKey: ["assignments", "me"],
    queryFn: () => api.get<MyShepherdRow[]>("/assignments/me"),
    enabled: typeof window !== "undefined",
  });
}

export function useAddMyFollowUpTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, title, dueDate }: { memberId: string; title: string; dueDate?: string }) =>
      api.post(`/assignments/me/${memberId}/follow-up`, { title, dueDate }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments", "me"] }),
  });
}

export function useToggleMyFollowUpTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) =>
      api.patch(`/assignments/me/follow-up/${taskId}`, { done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments", "me"] }),
  });
}

// ── Pastor: org-wide oversight ──────────────────────────────────────────────

export function useAllAssignments() {
  return useQuery({
    queryKey: ["assignments", "all"],
    queryFn: () => api.get<AssignmentRow[]>("/assignments"),
    enabled: typeof window !== "undefined",
  });
}

export function useOpenFollowUpTasks() {
  return useQuery({
    queryKey: ["members", "follow-ups"],
    queryFn: () => api.get<OpenFollowUpRow[]>("/members/follow-ups"),
    enabled: typeof window !== "undefined",
  });
}
