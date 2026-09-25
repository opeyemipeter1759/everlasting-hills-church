import { getBackendBaseUrl } from "@/lib/api/backend-url";

/**
 * Vercel ends Routing Middleware that hasn't answered within 25 seconds with
 * 504 MIDDLEWARE_INVOCATION_TIMEOUT. The API scales to zero and can take
 * 10–20 seconds to wake, so every call the middleware makes to it shares one
 * budget comfortably inside that limit, and each call has its own cap too.
 */
export const MIDDLEWARE_BACKEND_BUDGET_MS = 20_000;

/** Waking from zero is the slow case; a warm API answers in well under a second. */
export const REFRESH_TIMEOUT_MS = 15_000;
export const LOOKUP_TIMEOUT_MS = 5_000;

export class BackendTimeoutError extends Error {
  constructor(path: string) {
    super(`API did not answer ${path} in time`);
    this.name = "BackendTimeoutError";
  }
}

export function isBackendTimeout(error: unknown): error is BackendTimeoutError {
  return error instanceof BackendTimeoutError;
}

/** When this request's shared budget runs out. */
export function backendDeadline(now = Date.now()): number {
  return now + MIDDLEWARE_BACKEND_BUDGET_MS;
}

/**
 * fetch() against the API that gives up at `maxMs` or at the request's
 * deadline, whichever comes first, and says so with BackendTimeoutError rather
 * than a generic abort. (A plain AbortController and timer, which the Edge
 * runtime supports everywhere.)
 */
export async function fetchBackendWithin(
  path: string,
  init: RequestInit,
  { deadline, maxMs }: { deadline: number; maxMs: number },
): Promise<Response> {
  const wait = Math.min(maxMs, deadline - Date.now());
  if (wait <= 0) throw new BackendTimeoutError(path);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), wait);
  try {
    return await fetch(`${getBackendBaseUrl()}${path}`, { ...init, cache: "no-store", signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new BackendTimeoutError(path);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
