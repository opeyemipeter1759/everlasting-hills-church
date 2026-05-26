import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/frontend-session";

/**
 * Server-side HTTP client for Next.js Server Components and route handlers.
 *
 * Why a separate helper from `apiClient` (axios):
 *  - Server Components run on the Node side, with no `document.cookie`. Axios in this codebase
 *    reads cookies via JS — it would silently send unauthenticated requests from SSR.
 *  - This helper uses `next/headers` cookies() which is the official server-side accessor.
 *  - Returns the unwrapped envelope `data` so callers don't see infrastructure shape.
 *
 * Throws ApiError on non-2xx — Server Components will surface this to error.tsx boundaries.
 */
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;
}

interface ServerEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorEnvelope {
  error: {
    statusCode: number;
    message: string;
    code: string;
    requestId: string;
    details?: unknown;
  };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

function buildUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const jar = cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface FetchOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: Record<string, string>;
  /** Pass `false` to skip the cookie-borne JWT (for public endpoints). Defaults to true. */
  withAuth?: boolean;
  /** Next.js cache hint. Defaults to 'no-store' for authenticated calls (always fresh). */
  cache?: RequestCache;
  /** Next.js ISR revalidation. Useful for public, cache-friendly endpoints. */
  revalidate?: number;
}

async function request<T>(method: string, path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers = {}, withAuth = true, cache, revalidate, ...rest } = options;
  const authHeaders = withAuth ? await getAuthHeader() : {};

  // Cast to any to bridge Node's RequestInit and Next.js's augmented fetch options.
  // Next.js adds a `next` field that isn't in standard lib.dom; using a typed cast keeps
  // call sites honest while letting fetch() see the runtime-correct shape.
  const init = {
    ...rest,
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...(cache && { cache }),
    ...(revalidate !== undefined && { next: { revalidate } }),
  } as RequestInit;

  const response = await fetch(buildUrl(path), init);

  if (!response.ok) {
    let errorBody: ErrorEnvelope | undefined;
    try {
      errorBody = (await response.json()) as ErrorEnvelope;
    } catch {
      // body wasn't JSON; leave undefined
    }
    const err: ApiError = {
      status: response.status,
      message: errorBody?.error?.message ?? response.statusText,
      code: errorBody?.error?.code,
      requestId: errorBody?.error?.requestId,
      details: errorBody?.error?.details,
    };
    throw err;
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  const json = (await response.json()) as ServerEnvelope<T> | T;
  if (json && typeof json === "object" && "data" in (json as object)) {
    return (json as ServerEnvelope<T>).data;
  }
  return json as T;
}

export const serverApi = {
  get: <T>(path: string, options?: FetchOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>("PUT", path, { ...options, body }),
  delete: <T>(path: string, options?: FetchOptions) => request<T>("DELETE", path, options),
};
