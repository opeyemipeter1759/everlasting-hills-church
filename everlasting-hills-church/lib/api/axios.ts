import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { AUTH_ERROR_EVENT } from "../auth/frontend-session";
import { clearClientSessionState } from "../auth/logout";

/** Browser requests always use the same-origin Next BFF. */
const BASE_URL = "/api/backend";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

interface ServerEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}
apiClient.interceptors.response.use(
  (response: AxiosResponse<ServerEnvelope<unknown> | unknown>) => {
    const body = response.data as ServerEnvelope<unknown> | unknown;
    if (body && typeof body === "object" && "data" in (body as object)) {
      response.data = (body as ServerEnvelope<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isLoginOrRecovery =
      url.includes("/auth/login") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/recovery");

    // The BFF has already attempted one refresh and cleared its HttpOnly cookies
    // before a protected request reaches this branch.
    if (status === 401 && !isLoginOrRecovery) {
      clearClientSessionState();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
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
  if (error.request) return { message: "No response from server. Check your connection." };
  return { message: error.message };
}
