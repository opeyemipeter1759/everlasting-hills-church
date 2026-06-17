import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
  ACCESS_TOKEN_COOKIE,
  clearFrontendSession,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setFrontendSession,
} from "../auth/frontend-session";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";

/**
 * Single-flight access-token refresh. On a 401 we try to exchange the refresh token
 * for a fresh access token (POST /auth/refresh via raw axios so we don't re-enter this
 * interceptor) before giving up and logging the user out. Concurrent 401s share one
 * in-flight refresh so we don't stampede Supabase.
 */
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) return null;
  try {
    const resp = await axios.post(
      `${BASE_URL.replace(/\/$/, "")}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 },
    );
    const body = (resp.data?.data ?? resp.data) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      user?: { email?: string; role?: string | null; fullName?: string | null; picture?: string | null };
    };
    if (!body?.access_token) return null;
    setFrontendSession({
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      email: body.user?.email ?? "",
      role: body.user?.role ?? null,
      fullName: body.user?.fullName ?? null,
      picture: body.user?.picture ?? null,
      expiresInSeconds: body.expires_in,
    });
    return body.access_token;
  } catch {
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Backend response envelope shape (matches ResponseEnvelopeInterceptor).
 * Errors use a different shape (see AllExceptionsFilter) and are not wrapped here —
 * the response interceptor's error handler converts them.
 */
interface ServerEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Attach the Supabase JWT from the unified session cookie on every request.
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

/**
 * Unwrap successful envelope: response.data = { data, meta } → response.data = T
 *
 * Why unwrap here (not in callers):
 *  - Hundreds of call sites would otherwise need `.then(r => r.data.data)`.
 *  - The envelope is an infrastructure concern — callers shouldn't care it exists.
 *  - If a backend route ever returns an un-enveloped response, we tolerate that by
 *    falling back to the raw body.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ServerEnvelope<unknown> | unknown>) => {
    const body = response.data as ServerEnvelope<unknown> | unknown;
    if (body && typeof body === "object" && "data" in (body as object)) {
      response.data = (body as ServerEnvelope<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/refresh") || url.includes("/auth/login");

    // First 401 on a normal request → try to refresh once, then retry.
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall &&
      typeof window !== "undefined"
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient(original); // retry once with the fresh token
      }
    }

    // Refresh impossible/failed (or 401 on an auth call) → log out.
    if (status === 401) {
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
  code?: string;
  requestId?: string;
  details?: unknown;
}

/**
 * Convert AllExceptionsFilter's envelope into a flat ApiError the UI can render directly.
 * Also tolerates legacy / non-enveloped error responses (network errors, unknown servers).
 */
function normalizeError(error: AxiosError): ApiError {
  if (error.response) {
    const body = error.response.data as
      | { error?: { message?: string; code?: string; requestId?: string; details?: unknown } }
      | undefined;
    const enveloped = body?.error;
    return {
      message: enveloped?.message ?? error.message,
      status: error.response.status,
      code: enveloped?.code,
      requestId: enveloped?.requestId,
      details: enveloped?.details,
    };
  }
  if (error.request) {
    return { message: "No response from server. Check your connection." };
  }
  return { message: error.message };
}

export { ACCESS_TOKEN_COOKIE };
