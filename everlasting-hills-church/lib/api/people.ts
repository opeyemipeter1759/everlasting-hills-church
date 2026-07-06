"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { apiClient } from "@/lib/api/axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type PersonRole =
  | "SUPER_ADMIN"
  | "PASTOR"
  | "ADMIN"
  | "HEAD_USHER"
  | "UNIT_LEAD"
  | "MEMBER"
  | "VISITOR";

export interface PersonUnit {
  id: string;
  name: string;
  isLead: boolean;
  isAssistant: boolean;
}

export interface PersonShepherd {
  assignmentId: string;
  leaderId: string;
  leaderName: string;
}

export interface PersonRow {
  id: string;
  profileId: string | null;
  userId: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  photoUrl: string | null;
  role: PersonRole;
  status: string;
  tags: string[];
  dateOfBirth: string | null;
  address: string | null;
  joinedAt: string;
  attendanceCount: number;
  engagementScore: number;
  units: PersonUnit[];
  shepherdedBy: PersonShepherd[];
}

export interface DirectoryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    total: number;
    active: number;
    withUnit: number;
    thisMonth: number;
    byRole: Record<string, number>;
  };
}

export interface DirectoryResponse {
  data: PersonRow[];
  meta: DirectoryMeta;
}

export interface DirectoryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  gender?: string;
  unit?: string;
  hasUnit?: string;
  joinedFrom?: string;
  joinedTo?: string;
  birthMonth?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UnitOption {
  id: string;
  name: string;
}

export interface CreatePersonInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: "MALE" | "FEMALE";
  role: PersonRole;
}

export interface BulkCreateResult {
  created: { email: string; profileId: string }[];
  failed: { email: string; reason: string }[];
  total: number;
}

// Strip undefined/empty values so they don't become "undefined" query strings.
function clean(params: DirectoryParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

const PEOPLE_KEY = ["people"] as const;

// ── Queries ──────────────────────────────────────────────────────────────────

export function usePeople(params: DirectoryParams) {
  return useQuery({
    queryKey: [...PEOPLE_KEY, "directory", params],
    queryFn: () => api.get<DirectoryResponse>("/members/directory", clean(params)),
    placeholderData: keepPreviousData,
  });
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: ["users", "assignable-roles"],
    queryFn: () => api.get<PersonRole[]>("/users/assignable-roles"),
  });
}

export function useUnitOptions() {
  return useQuery({
    queryKey: ["units", "options"],
    queryFn: async () => {
      const units = await api.get<UnitOption[]>("/units");
      return units.map((u) => ({ id: u.id, name: u.name }));
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

function useInvalidatePeople() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PEOPLE_KEY });
}

export function useBulkCreatePeople() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (members: CreatePersonInput[]) =>
      api.post<BulkCreateResult>("/users/bulk", { members }),
    onSuccess: invalidate,
  });
}

export function useUpdateMember() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonRow> & { dateOfBirth?: string | null } }) =>
      api.patch(`/members/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useChangeRole() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: ({ profileId, role }: { profileId: string; role: PersonRole }) =>
      api.patch(`/users/${profileId}/role`, { role }),
    onSuccess: invalidate,
  });
}

export function useDeletePerson() {
  const invalidate = useInvalidatePeople();
  // Members carry a profileId; we delete through /users/:profileId (removes
  // Profile + Member + auth user). Falls back to /members/:id when no profile.
  return useMutation({
    mutationFn: ({ profileId, memberId }: { profileId: string | null; memberId: string }) =>
      profileId
        ? api.delete(`/users/${profileId}`)
        : api.delete(`/members/${memberId}`),
    onSuccess: invalidate,
  });
}

export function useBulkMemberOp() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (body: {
      ids: string[];
      op: "status" | "addTag" | "removeTag";
      value: string;
    }) => api.patch<{ updated: number }>("/members/bulk", body),
    onSuccess: invalidate,
  });
}

export function useAssignMembers() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (body: { memberIds: string[]; leaderId: string; note?: string }) =>
      api.post<{ assigned: number; skipped: number }>("/assignments", body),
    onSuccess: invalidate,
  });
}

export function useRemoveAssignment() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: invalidate,
  });
}

// ── Export (file download) ───────────────────────────────────────────────────

/** Download the filtered directory as an Excel file (honors the same filters). */
export async function downloadPeopleExport(params: DirectoryParams): Promise<void> {
  const res = await apiClient.get("/members/export", {
    params: clean(params),
    responseType: "blob",
  });
  const blob = new Blob([res.data as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `people-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
