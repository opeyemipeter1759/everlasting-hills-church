import { clearServiceWorkerCaches } from "@/lib/pwa/service-worker";
import { clearFrontendSession, markLogoutPending } from "./frontend-session";

let logoutPromise: Promise<void> | null = null;

const PRIVATE_LOCAL_STORAGE_KEYS = [
  "ehc:registered-events",
  "ehc:last-seen-announcement-at",
  "starredMessages",
] as const;
const PRIVATE_LOCAL_STORAGE_PREFIXES = ["streak-level-seen:"] as const;

function clearPrivateLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of PRIVATE_LOCAL_STORAGE_KEYS) window.localStorage.removeItem(key);
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key && PRIVATE_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage can be disabled by privacy settings. Cookie/query/SW cleanup must
    // still continue even when localStorage is unavailable.
  }
}

/** Clear every browser-resident source of user-specific state. */
export function clearClientSessionState({ markPending = true }: { markPending?: boolean } = {}): void {
  clearFrontendSession();
  if (markPending) markLogoutPending();
  clearPrivateLocalStorage();
  clearServiceWorkerCaches();
}

/**
 * Single logout path used by every shell/menu. The server response clears the
 * HttpOnly credentials; the finally block clears UI cookies, Query caches (via
 * SESSION_CLEARED_EVENT), and service-worker member caches even when offline.
 */
export function logoutFrontendSession(): Promise<void> {
  if (!logoutPromise) {
    // Purge private in-memory/offline data synchronously; a slow or offline
    // network must not leave the previous member's dashboard readable.
    clearClientSessionState();
    logoutPromise = fetch("/api/backend/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: "{}",
      cache: "no-store",
    })
      .then(() => undefined)
      // Local sign-out must still finish while offline. The HttpOnly cookie can
      // only be removed by a later server response, but private browser state is
      // already gone and every caller should be allowed to navigate away.
      .catch(() => undefined)
      .finally(() => {
        // Do not recreate the marker after a successful BFF response has just
        // deleted it. If the request failed, the marker set above still exists.
        clearClientSessionState({ markPending: false });
        logoutPromise = null;
      });
  }
  return logoutPromise;
}
