"use client";

/**
 * Service worker registration and the small message protocol the app uses to
 * talk to it. Kept separate from the install prompt UI so that non-UI callers
 * (logout, login) can reach it without pulling in React.
 *
 * The worker itself is app/sw.ts, compiled to /sw.js by Serwist at build time.
 * It is disabled in development (see next.config.mjs), so every function here
 * is a no-op locally rather than throwing.
 */

export function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/** True when running as an installed PWA rather than in a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates display-mode and exposes this instead.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    // A failed registration must never break the app. Offline support is an
    // enhancement; the app works without it.
    return null;
  }
}

async function post(message: Record<string, unknown>): Promise<void> {
  if (!isServiceWorkerSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage(message);
  } catch {
    /* no worker, nothing to tell */
  }
}

/**
 * Scopes the API cache to a specific member. Called after login.
 *
 * Without this, two members signing in on the same phone would share one cache
 * namespace and the second could be served the first one's dashboard from disk.
 * Shared devices are common in this congregation, so this is not hypothetical.
 */
export function setServiceWorkerUser(userKey: string): Promise<void> {
  return post({ type: "SET_USER", userKey });
}

/**
 * Drops every cache that can hold member data. Called from logout.
 *
 * Static and font caches are intentionally left alone: they contain nothing
 * member-specific, and re-downloading them on a slow connection would cost the
 * next user real time and data for no privacy benefit.
 */
export function clearServiceWorkerCaches(): Promise<void> {
  return post({ type: "CLEAR_CACHES" });
}
