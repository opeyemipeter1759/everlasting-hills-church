import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  clearFrontendSession,
  setFrontendSession,
} from "@/lib/auth/frontend-session";
import { LoginPayload, LatestSermon, User, SermonAdminOverviewData, CreateSermonPayload, UpdateSermonPayload } from "@/types";
import type { UserRole } from "@/config/config";

export interface MeResponse {
  profileId: string | null;
  role: string | null;
  tenantId: string | null;
  member: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
    joinedAt: string;
    occupation: string | null;
    facebookLink: string | null;
    instagramLink: string | null;
    tiktokLink: string | null;
  } | null;
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<MeResponse>("/auth/me"),
    enabled: typeof window !== "undefined",
  });
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: UserRole | string | null;
    fullName: string | null;
    picture: string | null;
    /** True when the account was just created with a temp (phone-number) password. */
    needsPasswordChange: boolean;
  };
}


export const auth = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    setFrontendSession({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      email: response.user.email,
      role: response.user.role ?? null,
      fullName: response.user.fullName,
      picture: response.user.picture,
      expiresInSeconds: response.expires_in,
    });

    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearFrontendSession();
    }
  },
}
export function useUsers(filters: object = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => api.get<User[]>("/users", filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<User, "id">) => api.post<User>("/users", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });

}

export function useLatestSermons() {
  return useQuery({
    queryKey: ["sermons", "latest"],
    queryFn: () => api.get<LatestSermon[]>("/sermons/latest"),
    enabled: typeof window !== "undefined",
  });
}

export function useSermons(filters: { q?: string; tag?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["sermons", "list", filters],
    queryFn: () => api.get<LatestSermon[]>('/sermons', filters),
    enabled: typeof window !== "undefined",
  });
}

export function useSermonAdminOverview() {
  return useQuery({
    queryKey: ["sermons", "admin", "overview"],
    queryFn: () => api.get<SermonAdminOverviewData>("/sermons/admin/overview"),
  });
}

export function useSermon(id?: string) {
  return useQuery({
    queryKey: ["sermons", "admin", "detail", id],
    queryFn: () => api.get<LatestSermon>(`/sermons/admin/${id}`),
    enabled: !!id,
  });
}

export function useCreateSermon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSermonPayload) =>
      api.post<LatestSermon>("/sermons/admin", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sermons"] });
    },
  });
}

export function useUpdateSermon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSermonPayload }) =>
      api.patch<LatestSermon>(`/sermons/admin/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sermons"] });
    },
  });
}

export interface CanMarkResponse {
  canMark: boolean;
  reason?: 'NO_OPEN_SESSION' | 'ALREADY_MARKED';
}

export function useCanMark(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['attendance', 'can-mark'],
    queryFn: () => api.get<CanMarkResponse>('/attendance/can-mark'),
    enabled: (options?.enabled ?? true) && typeof window !== 'undefined',
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/attendance/check-in'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'can-mark'] });
    },
  });
}

export interface MemberAttendanceOverview {
  attendance: {
    marked: number;
    total: number;
    percentage: number;
    lastMarkedAt: string | null;
  };
}

export function useMemberOverview() {
  return useQuery({
    queryKey: ['overview', 'member'],
    queryFn: () => api.get<MemberAttendanceOverview>('/overview/member'),
    enabled: typeof window !== 'undefined',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Attendance endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionBannerResponse {
  hasActiveSession: boolean;
  session: {
    id: string;
    serviceName: string;
    serviceKey: string;
    date: string;
    closesAt: string;
    checkedInCount: number;
  } | null;
  nextSession: {
    serviceName: string;
    serviceKey: string;
    opensAt: string;
  } | null;
}

export function useSessionBanner() {
  return useQuery({
    queryKey: ['sessions', 'banner'],
    queryFn: () => api.get<SessionBannerResponse>('/sessions/banner'),
    enabled: typeof window !== 'undefined',
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ serviceId: string | null; marked: number }>('/sessions/close'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'banner'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'admin', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats', 'overview'] });
    },
  });
}

export interface AdminStatsOverview {
  totalMembers: number;
  activeThisMonth: number;
  inactiveThisMonth: number;
  todayPresent: number;
}

export function useAdminStatsOverview() {
  return useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => api.get<AdminStatsOverview>('/admin/stats/overview'),
    enabled: typeof window !== 'undefined',
  });
}

export interface AttendanceRow {
  id: string;
  sessionId: string;
  serviceName: string;
  serviceKey: string;
  date: string;
  userId: string;
  userName: string;
  photoUrl: string | null;
  status: 'PRESENT' | 'ABSENT';
  markedBy: 'SELF' | 'ADMIN';
  markedAt: string | null;
}

export interface AttendanceListQuery {
  page?: number;
  limit?: number;
  name?: string;
  status?: 'PRESENT' | 'ABSENT';
  serviceKey?: string;
  year?: string;
  month?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  markedBy?: 'SELF' | 'ADMIN';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AttendanceListResponse {
  data: AttendanceRow[];
  filters: Record<string, string | null>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    presentCount: number;
    absentCount: number;
  };
}

export function useAttendanceList(query: AttendanceListQuery = {}) {
  return useQuery({
    queryKey: ['attendance', 'admin', 'list', query],
    queryFn: () => api.get<AttendanceListResponse>('/attendance', query as Record<string, unknown>),
    enabled: typeof window !== 'undefined',
    placeholderData: (prev) => prev,
  });
}

export function useOverrideAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, userId, status }: { sessionId: string; userId: string; status: 'PRESENT' | 'ABSENT' }) =>
      api.patch(`/attendance/session/${sessionId}/member/${userId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'admin', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats', 'overview'] });
    },
  });
}

export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, userIds, status }: { sessionId: string; userIds: string[]; status: 'PRESENT' | 'ABSENT' }) =>
      api.patch(`/attendance/session/${sessionId}/bulk`, { userIds, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'admin', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats', 'overview'] });
    },
  });
}

export async function downloadAttendanceCsv(params: AttendanceListQuery = {}) {
  const { apiClient } = await import('@/lib/api/axios');
  const res = await apiClient.get('/attendance/export', { params, responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = 'attendance-export.xlsx';
  a.click();
  URL.revokeObjectURL(href);
}

export interface MembersAtRisk {
  absentConsecutiveWeeks: { userId: string; userName: string; photoUrl: string | null; phone: string | null; consecutiveAbsences: number; lastSeen: string | null }[];
  neverAttended: { userId: string; userName: string; photoUrl: string | null; phone: string | null; joinedAt: string }[];
  belowFiftyPercent: { userId: string; userName: string; photoUrl: string | null; phone: string | null; presentCount: number; totalCount: number; rate: number }[];
}

export function useMembersAtRisk() {
  return useQuery({
    queryKey: ['members', 'at-risk'],
    queryFn: () => api.get<MembersAtRisk>('/members/at-risk'),
    enabled: typeof window !== 'undefined',
  });
}

export interface TodayFeedResponse {
  date: string;
  sessionId: string | null;
  serviceName: string | null;
  checkins: { userId: string; userName: string; photoUrl: string | null; markedAt: string; markedBy: string }[];
}

export function useTodayFeed() {
  return useQuery({
    queryKey: ['attendance', 'feed', 'today'],
    queryFn: () => api.get<TodayFeedResponse>('/attendance/feed/today'),
    enabled: typeof window !== 'undefined',
  });
}

export interface ServiceComparisonResponse {
  period: string;
  services: { serviceKey: string; serviceName: string; present: number; absent: number; total: number; rate: number }[];
}

export function useServiceComparison(period: string) {
  return useQuery({
    queryKey: ['reports', 'service-comparison', period],
    queryFn: () => api.get<ServiceComparisonResponse>('/reports/service-comparison', { period }),
    enabled: typeof window !== 'undefined' && !!period,
  });
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function triggerDownload(path: string, filename: string, params?: Record<string, string | undefined>) {
  const { apiClient } = await import('@/lib/api/axios');
  const res = await apiClient.get(path, { params, responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], { type: XLSX_MIME });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export const reports = {
  monthly: (month: string) => triggerDownload('/reports/monthly', `attendance-${month}.xlsx`, { month }),
  member: (userId: string) => triggerDownload(`/reports/member/${userId}`, `member-history.xlsx`),
  range: (from: string, to: string) => triggerDownload('/reports/range', `attendance-${from}_${to}.xlsx`, { from, to }),
  serviceComparison: (period: string) => triggerDownload('/reports/service-comparison', `service-comparison-${period}.xlsx`, { period, format: 'xlsx' }),
};

export interface RoleEntry {
  role: string;
  label: string;
  level: number;
  count: number;
}

export function useUserRoles() {
  return useQuery({
    queryKey: ['users', 'roles'],
    queryFn: () => api.get<RoleEntry[]>('/users/roles'),
    enabled: typeof window !== 'undefined',
  });
}

export interface UsersByRole {
  SUPER_ADMIN: { profileId: string; userId: string; role: string; member: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null } | null }[];
  PASTOR:      { profileId: string; userId: string; role: string; member: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null } | null }[];
  ADMIN:       { profileId: string; userId: string; role: string; member: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null } | null }[];
  UNIT_LEAD:   { profileId: string; userId: string; role: string; member: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null; units?: { unitId: string; unitName: string; isLead: boolean; isAssistant: boolean }[] } | null }[];
  MEMBER:      { profileId: string; userId: string; role: string; member: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null } | null }[];
  VISITOR:     { id: string; firstName: string; lastName: string; email: string | null; phone: string | null }[];
}

export function useUsersByRole() {
  return useQuery({
    queryKey: ['users', 'by-role'],
    queryFn: () => api.get<UsersByRole>('/users/by-role'),
    enabled: typeof window !== 'undefined',
  });
}

export interface UserListItem {
  profileId: string;
  userId: string;
  role: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
    joinedAt: string;
    status: string;
  } | null;
}

/** Fetches users for a single role — only runs when `role` is provided. */
export function useUsersBySpecificRole(role: string) {
  return useQuery({
    queryKey: ['users', 'list', { role }],
    queryFn: () => api.get<UserListItem[]>('/users', { role }),
    enabled: typeof window !== 'undefined' && !!role && role !== 'VISITOR',
  });
}

export function useChangePassword() {
  const mutation = useMutation({
    mutationFn: (password: string) =>
      api.post<void>("/auth/change-password", { password }),
  });

  return {
    submit: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
  };
}

