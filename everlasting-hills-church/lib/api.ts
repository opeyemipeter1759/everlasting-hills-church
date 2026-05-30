import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  clearFrontendSession,
  setFrontendSession,
} from "@/lib/auth/frontend-session";
import { LoginPayload, LoginResponse, LatestSermon, User, SermonAdminOverviewData, CreateSermonPayload, UpdateSermonPayload } from "@/types";



export const auth = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", payload);

    setFrontendSession({
      accessToken: response.access_token,
      email: response.user.email,
      role: response.user.role ?? null,
      fullName:
        response.user.fullName ??
        ([response.user.firstName, response.user.lastName].filter(Boolean).join(" ") || null),
      picture: response.user.picture ?? null,
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
  });
}

export function useSermons(filters: { q?: string; tag?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["sermons", "list", filters],
    queryFn: () => api.get<LatestSermon[]>('/sermons', filters),
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

