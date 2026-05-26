import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
  ACCESS_TOKEN_COOKIE,
  clearFrontendSession,
  getAccessTokenFromCookie,
} from "../auth/frontend-session";

/**
 * Single axios instance for all backend (NestJS) calls.
 *
 * BASE_URL must point to the NestJS API (e.g. https://api.everlastinghills.org).
 * Default of "/api" preserves dev-server proxy behavior if configured.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";

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
