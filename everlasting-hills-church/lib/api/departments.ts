"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DeptPerson {
  profileId: string;
  name: string;
  photoUrl: string | null;
  assignedAt?: string;
}

export interface DeptUnitLead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  photoUrl: string | null;
  status?: string;
}

export interface DeptUnit {
  id: string;
  name: string;
  memberCount: number;
  lead: DeptUnitLead | null;
}

export interface DepartmentListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  unitCount: number;
  memberCount: number;
  head: DeptPerson | null;
}

export interface DeptHod extends DeptPerson {
  assignedAt: string;
}

export interface UnassignedUnit {
  id: string;
  name: string;
  memberCount: number;
}

export interface DepartmentsIndex {
  departments: DepartmentListItem[];
  unassignedUnits: UnassignedUnit[];
}

export interface HistoryEntry {
  id: string;
  assignedAt: string;
  endedAt: string | null;
  user: DeptPerson | null;
  assignedBy: DeptPerson | null;
}

export interface DepartmentDetail {
  department: { id: string; code: string; name: string; description: string | null; sortOrder: number };
  memberCount: number;
  currentHead: DeptPerson | null;
  hods: DeptHod[];
  units: DeptUnit[];
  history: HistoryEntry[];
}

export interface MyDepartment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  memberCount: number;
  /** "ADMIN_HEAD" if the viewer fully heads this department, else "HOD" (scoped
   * to appointing unit leads only). */
  myRole: "ADMIN_HEAD" | "HOD";
  hods: DeptHod[];
  units: DeptUnit[];
}

export interface MyDepartmentsResponse {
  departments: MyDepartment[];
}

// ── Queries ──────────────────────────────────────────────────────────────────

const KEY = ["departments"] as const;

export function useDepartments() {
  return useQuery({
    queryKey: [...KEY, "index"],
    queryFn: () => api.get<DepartmentsIndex>("/departments"),
  });
}

export function useDepartment(id: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "one", id],
    queryFn: () => api.get<DepartmentDetail>(`/departments/${id}`),
    enabled: Boolean(id),
  });
}

export function useMyDepartments() {
  return useQuery({
    queryKey: [...KEY, "mine"],
    queryFn: () => api.get<MyDepartmentsResponse>("/departments/mine"),
  });
}

export interface UnitRosterMember {
  memberId: string;
  isLead: boolean;
  isAssistant: boolean;
  Member: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null; status: string };
}

export interface UnitRoster {
  id: string;
  name: string;
  members: UnitRosterMember[];
}

export function useMyUnitRoster(unitId: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "mine", "roster", unitId],
    queryFn: () => api.get<UnitRoster>(`/departments/mine/units/${unitId}/roster`),
    enabled: Boolean(unitId),
  });
}

interface RawUnitDetail {
  id: string;
  name: string;
  UnitMember: UnitRosterMember[];
}

/** ADMIN+/PASTOR/SUPER_ADMIN roster for ANY unit (not scoped to "mine") — used
 * when managing a department the viewer doesn't personally head. */
export function useAnyUnitRoster(unitId: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "any", "roster", unitId],
    queryFn: async () => {
      const raw = await api.get<RawUnitDetail>(`/units/${unitId}`);
      const roster: UnitRoster = { id: raw.id, name: raw.name, members: raw.UnitMember };
      return roster;
    },
    enabled: Boolean(unitId),
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

/** Head/HOD/unit-lead assignment also changes the "users" query namespace —
 * the Roles page's rollup (["users","roles"]) and by-role groups
 * (["users","by-role"]) are derived from these same assignments. */
function useInvalidateDeptAndUsers() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["users"] });
  };
}

export function useAssignHead(id: string) {
  const invalidate = useInvalidateDeptAndUsers();
  return useMutation({
    mutationFn: (profileId: string) => api.post<DepartmentDetail>(`/departments/${id}/head`, { profileId }),
    onSuccess: invalidate,
  });
}

export function useRemoveHead(id: string) {
  const invalidate = useInvalidateDeptAndUsers();
  return useMutation({
    mutationFn: () => api.delete<DepartmentDetail>(`/departments/${id}/head`),
    onSuccess: invalidate,
  });
}

export function useAssignHod(id: string) {
  const invalidate = useInvalidateDeptAndUsers();
  return useMutation({
    mutationFn: (profileId: string) => api.post<{ hods: DeptHod[] }>(`/departments/${id}/hods`, { profileId }),
    onSuccess: invalidate,
  });
}

export function useRemoveHod(id: string) {
  const invalidate = useInvalidateDeptAndUsers();
  return useMutation({
    mutationFn: (profileId: string) => api.delete<{ hods: DeptHod[] }>(`/departments/${id}/hods/${profileId}`),
    onSuccess: invalidate,
  });
}

export function useAssignUnits(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (unitIds: string[]) => api.post<{ assigned: number }>(`/departments/${id}/units`, { unitIds }),
    onSuccess: invalidate,
  });
}

export function useUnassignUnit(deptId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (unitId: string) => api.delete<{ unassigned: boolean }>(`/departments/${deptId}/units/${unitId}`),
    onSuccess: invalidate,
  });
}

export function useUpdateDepartment(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string | null; sortOrder?: number }) =>
      api.patch(`/departments/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeptAnnouncement(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { title: string; body: string }) =>
      api.post<{ recipients: number }>(`/departments/${id}/announcements`, body),
    onSuccess: invalidate,
  });
}

export function useMyDeptAnnouncement() {
  return useMutation({
    mutationFn: (body: { departmentId: string; title: string; body: string }) =>
      api.post<{ recipients: number }>("/departments/mine/announcements", body),
  });
}

export function useNudgeLead() {
  return useMutation({
    mutationFn: ({ unitId, message }: { unitId: string; message?: string }) =>
      api.post<{ notified: number }>(`/departments/mine/units/${unitId}/nudge`, { message }),
  });
}

// ── Unit lead appointment (delegated to Admin Heads within their department) ──

export function useAppointUnitLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, profileId }: { unitId: string; profileId: string }) =>
      api.post<{ leadProfileId: string; actedAs: string }>(`/units/${unitId}/lead`, { profileId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useRemoveUnitLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => api.delete(`/units/${unitId}/lead`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });
}
