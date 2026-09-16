import { getBackendBaseUrl } from "@/lib/api/backend-url";
import type { ApiReader } from "./daily-scripture";

/**
 * How long a scripture request waits for the API before answering from the
 * bundled copy. The API scales to zero and a cold start takes far longer than
 * a visitor should wait for a verse the website already has.
 */
export const SCRIPTURE_API_TIMEOUT_MS = 3000;

/** Reads a public API path without credentials; null for any non-success answer. */
export const readPublicApi: ApiReader = async (path) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRIPTURE_API_TIMEOUT_MS);
  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: unknown } | null;
    return body && typeof body === "object" && "data" in body ? body.data : body;
  } finally {
    clearTimeout(timer);
  }
};
