import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  clearFrontendSession,
  setFrontendSession,
  type UserRole,
} from "@/lib/auth/frontend-session";

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
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const auth = {
  /**
   * Login flow:
   *   1. Backend validates credentials with Supabase and returns the real JWT
   *   2. We persist the JWT + role + email in one unified cookie system
   *   3. Subsequent axios requests attach the JWT automatically
   *   4. Middleware will verify the JWT signature on next navigation
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", payload);

    setFrontendSession({
      accessToken: response.access_token,
      email: response.user.email,
      role: response.user.role ?? null,
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

// ── Example data hooks (kept for reference; users/* endpoints are not implemented yet) ─

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
