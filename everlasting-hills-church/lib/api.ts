import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  clearFrontendSession,
  setFrontendSession,
} from "@/lib/auth/frontend-session";
import { LoginPayload, LatestSermon, User, SermonAdminOverviewData, CreateSermonPayload, UpdateSermonPayload, SermonStatus, Unit, UnitDetail, UnitMemberEntry } from "@/types";
import type { UserRole } from "@/config/config";
import type {
  SermonDetailRaw,
  MemberSermonContext,
  SermonComment,
  ReactionType,
  MemberPickerResult,
  SermonDirectMessage,
  DirectMessageType,
} from "@/lib/api/sermon-types";

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

export function usePublishedSermons(filters: { series?: string; search?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["sermons", "published", filters],
    queryFn: () => api.get<LatestSermon[]>("/sermons/published", filters),
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

export function useAdminSermons(filters: { status?: SermonStatus; series?: string } = {}) {
  return useQuery({
    queryKey: ["sermons", "admin", "list", filters],
    queryFn: () => api.get<LatestSermon[]>("/sermons/admin", filters),
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

export function useDeleteSermon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/sermons/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sermons"] });
    },
  });
}

/* ── Public sermon watch experience — detail, reactions, notes, comments, Q&A ──────── */

export function useSermonBySlug(slug?: string) {
  return useQuery({
    queryKey: ["sermons", "public", "detail", slug],
    queryFn: () => api.get<SermonDetailRaw>(`/sermons/slug/${slug}`),
    enabled: !!slug,
  });
}

/** Only fires for signed-in visitors — anonymous calls to /sermons/me/* would 401-loop. */
export function useSermonMemberContext(sermonId?: string, isLoggedIn?: boolean) {
  return useQuery({
    queryKey: ["sermons", "me", "context", sermonId],
    queryFn: () => api.get<MemberSermonContext>(`/sermons/me/${sermonId}/context`),
    enabled: !!sermonId && !!isLoggedIn,
  });
}

export function useSermonReaction() {
  return useMutation({
    mutationFn: ({ sermonId, type }: { sermonId: string; type: ReactionType }) =>
      api.post(`/sermons/me/${sermonId}/reaction`, { type }),
  });
}

export function useSermonBookmark() {
  return useMutation({
    mutationFn: (sermonId: string) => api.post<boolean>(`/sermons/me/${sermonId}/bookmark`),
  });
}

export function useSermonNote() {
  return useMutation({
    mutationFn: ({ sermonId, content }: { sermonId: string; content: string }) =>
      api.post(`/sermons/me/${sermonId}/note`, { content }),
  });
}

export function useSermonProgress() {
  return useMutation({
    mutationFn: ({ sermonId, positionSec, completed }: { sermonId: string; positionSec: number; completed?: boolean }) =>
      api.post(`/sermons/me/${sermonId}/progress`, { positionSec, completed }),
  });
}

export function useIncrementSermonPlay() {
  return useMutation({
    mutationFn: (sermonId: string) => api.post(`/sermons/${sermonId}/play`),
  });
}

export function useSermonComments(sermonId?: string) {
  return useQuery({
    queryKey: ["sermons", "comments", sermonId],
    queryFn: () => api.get<SermonComment[]>(`/sermons/${sermonId}/comments`),
    enabled: !!sermonId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sermonId, content, parentId }: { sermonId: string; content: string; parentId?: string }) =>
      api.post<SermonComment>(`/sermons/me/${sermonId}/comments`, { content, parentId }),
    onSuccess: (_data, { sermonId }) => {
      queryClient.invalidateQueries({ queryKey: ["sermons", "comments", sermonId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; sermonId: string }) =>
      api.delete<{ id: string; deleted: boolean }>(`/sermons/me/comments/${commentId}`),
    onSuccess: (_data, { sermonId }) => {
      queryClient.invalidateQueries({ queryKey: ["sermons", "comments", sermonId] });
    },
  });
}

export function useAnswerQuestion() {
  return useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      api.post(`/sermons/me/questions/${questionId}/response`, { content }),
  });
}

/* ── Direct notes/questions to another member, about a sermon ──────────────────────── */

export function useMemberSearch(q: string) {
  return useQuery({
    queryKey: ["members", "search", q],
    queryFn: () => api.get<MemberPickerResult[]>("/members/search", { q }),
    enabled: q.trim().length >= 2,
  });
}

export function useSermonDirectMessages(sermonId?: string) {
  return useQuery({
    queryKey: ["sermons", "direct-messages", sermonId],
    queryFn: () => api.get<SermonDirectMessage[]>(`/sermons/me/${sermonId}/direct-messages`),
    enabled: !!sermonId,
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sermonId, recipientMemberId, type, content, parentId,
    }: { sermonId: string; recipientMemberId: string; type: DirectMessageType; content: string; parentId?: string }) =>
      api.post<SermonDirectMessage>(`/sermons/me/${sermonId}/direct-messages`, { recipientMemberId, type, content, parentId }),
    onSuccess: (_data, { sermonId }) => {
      queryClient.invalidateQueries({ queryKey: ["sermons", "direct-messages", sermonId] });
    },
  });
}

/* ── Member "My Learning" — bookmarks + continue-listening history ─────────────────── */

export interface MemberBookmarkEntry {
  id: string;
  createdAt: string;
  Sermon: LatestSermon;
}

export function useMemberSermonBookmarks() {
  return useQuery({
    queryKey: ["sermons", "me", "bookmarks"],
    queryFn: () => api.get<MemberBookmarkEntry[]>("/sermons/me/bookmarks"),
  });
}

export interface MemberHistoryEntry {
  id: string;
  positionSec: number;
  completed: boolean;
  updatedAt: string;
  Sermon: LatestSermon;
}

export function useMemberSermonHistory() {
  return useQuery({
    queryKey: ["sermons", "me", "history"],
    queryFn: () => api.get<MemberHistoryEntry[]>("/sermons/me/history"),
  });
}

export interface MemberSermonStats {
  completed: number;
  inProgress: number;
  bookmarked: number;
}

export function useMemberSermonStats() {
  return useQuery({
    queryKey: ["sermons", "me", "stats"],
    queryFn: () => api.get<MemberSermonStats>("/sermons/me/stats"),
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
      // Refresh check-in state AND the member's history table so a fresh
      // check-in shows up immediately.
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
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

// ─────────────────────────────────────────────────────────────────────────────
// Units
// ─────────────────────────────────────────────────────────────────────────────

export function useUnitsList() {
  return useQuery({
    queryKey: ["units"],
    queryFn: () => api.get<Unit[]>("/units"),
    enabled: typeof window !== "undefined",
  });
}

export interface MyUnit {
  id: string;
  name: string;
  description: string | null;
  totalMembers: number;
  isLead: boolean;
  isAssistant: boolean;
}

/** The unit the current user leads, assists, or otherwise belongs to (or null). */
export function useMyUnit() {
  return useQuery({
    queryKey: ["units", "me"],
    queryFn: () => api.get<MyUnit | null>("/units/me"),
    enabled: typeof window !== "undefined",
  });
}

export function useUnitDetail(unitId: string | null) {
  return useQuery({
    queryKey: ["units", unitId],
    queryFn: () => api.get<UnitDetail>(`/units/${unitId}`),
    enabled: !!unitId,
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      api.post<Unit>("/units", { name, description: description || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => api.delete(`/units/${unitId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useAddUnitMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, memberId, isLead }: { unitId: string; memberId: string; isLead: boolean }) =>
      api.post<UnitMemberEntry>(`/units/${unitId}/members`, { memberId, isLead }),
    onSuccess: (_data, { unitId }) => {
      qc.invalidateQueries({ queryKey: ["units", unitId] });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useRemoveUnitMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, memberId }: { unitId: string; memberId: string }) =>
      api.delete(`/units/${unitId}/members/${memberId}`),
    onSuccess: (_data, { unitId }) => {
      qc.invalidateQueries({ queryKey: ["units", unitId] });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useSetUnitMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, memberId, isLead }: { unitId: string; memberId: string; isLead: boolean }) =>
      api.patch(`/units/${unitId}/members/${memberId}`, { isLead }),
    onSuccess: (_data, { unitId }) => {
      qc.invalidateQueries({ queryKey: ["units", unitId] });
    },
  });
}

