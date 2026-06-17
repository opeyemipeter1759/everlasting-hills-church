import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  clearFrontendSession,
  setFrontendSession,
} from "@/lib/auth/frontend-session";
import { LoginPayload, LatestSermon, User, SermonAdminOverviewData, CreateSermonPayload, UpdateSermonPayload } from "@/types";
import type { UserRole } from "@/config/config";

/**
 * Strict backend contract. The NestJS /auth/login response shape is known and locked.
 * If the backend changes shape, this type forces us to update — no more fishing-expedition
 * optional fields swallowing breakage.
 */
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
};




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
    // Axios needs an absolute base URL; skip the query on the server where
    // NEXT_PUBLIC_API_BASE_URL may not be set and relative URLs fail in Node.
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

