// src/features/users/api.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { setAuthTokens } from "@/lib/api/authTokens";
import { queryKeys } from "./api/queryKeys";

export interface User {
  id: string;
  name: string;
  email: string;
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

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  token?: string;
  role?: string;
  user?: { role?: string };
  profile?: { role?: string };
  [key: string]: unknown;
};

export type CurrentUser = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  picture: string;
};

export const auth = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<LoginResponse>("/auth/login", payload);

    setAuthTokens({
      accessToken: response.access_token ?? response.accessToken ?? response.token,
      refreshToken: response.refresh_token ?? response.refreshToken,
    });

    return response;
  },
  me: () => api.get<CurrentUser>("/auth/me"),
};

export function useAuthMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: auth.me,
  });
}

export const useCurrentUser = useAuthMe;
