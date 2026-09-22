import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { AUTH_ERROR_EVENT } from "../auth/frontend-session";
import { clearClientSessionState } from "../auth/logout";
import { userMessageForError } from "./user-message";

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
    return Promise.reject(normalizeError(error, isLoginOrRecovery));
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
 * What to show when signing in is refused. Wrong details get a plain,
 * actionable sentence; any other reason the API gives (e.g. an opted-out
 * account) is already written for people and is shown as-is.
 */
function signInFailureMessage(message: string): string {
  if (!message || /invalid (email|login)|credentials/i.test(message)) {
    return "That email and password don't match. Check them and try again, or use Forgot password to reset it.";
  }
  return userMessageForError({ message });
}

function normalizeError(error: AxiosError, isLoginOrRecovery = false): ApiError {
  if (error.response) {
    const body = error.response.data as
      | {
          message?: string;
          error?: { message?: string; code?: string; requestId?: string; details?: unknown };
        }
      | undefined;
    const enveloped = body?.error;
    const status = error.response.status;
    const message = enveloped?.message ?? body?.message ?? error.message;
    return {
      // A 401 from signing in means the details were wrong (or the account is
      // blocked), not that a session expired — every failed login used to be
      // reported as "Your session has expired", so people with a mistyped
      // password kept retrying without knowing why.
      message:
        status === 401 && isLoginOrRecovery
          ? signInFailureMessage(message)
          : userMessageForError({ message, status, code: enveloped?.code }),
      status,
      code: enveloped?.code,
      requestId: enveloped?.requestId,
      details: enveloped?.details,
    };
  }
  return { message: userMessageForError(error) };
}
