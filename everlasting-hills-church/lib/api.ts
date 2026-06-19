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
    refetchInterval: 30_000,
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

