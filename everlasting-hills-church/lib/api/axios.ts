import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import {
  ACCESS_TOKEN_COOKIE,
  clearFrontendSession,
} from "../auth/frontend-session";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Attach the Supabase JWT from the unified session cookie on every request.
 * The cookie name is the single source of truth — same one middleware reads.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessTokenFromCookie();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearFrontendSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

function normalizeError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as { message?: string | string[] } | undefined;
    const msg = Array.isArray(data?.message) ? data!.message.join("; ") : data?.message;
    return {
      message: msg ?? error.message,
      status: error.response.status,
      data: error.response.data,
    };
  }
  if (error.request) {
    return { message: "No response from server. Check your connection." };
  }
  return { message: error.message };
}

// Re-export the cookie name for any consumer that needs to clear/inspect it.
export { ACCESS_TOKEN_COOKIE };
