"use client";

import { isServiceWorkerSupported } from "./service-worker";

/**
 * Member-initiated sermon downloads.
 *
 * Sermon audio is never cached automatically (see the NetworkOnly rule in
 * app/sw.ts): files are tens of MB and mobile data here is metered, so a
 * background download nobody asked for is a real cost to the member. Saving is
 * therefore always an explicit tap, and always reversible.
 */

const SERMON_CACHE = "ehc-sermons-offline";

/** True when this sermon's audio is already saved on the device. */
export async function isSermonSaved(audioUrl: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(SERMON_CACHE);
    return Boolean(await cache.match(audioUrl, { ignoreVary: true }));
  } catch {
    return false;
  }
}

/**
 * Saves a sermon for offline listening. Resolves true on success.
 *
 * The fetch runs in the service worker rather than the page so an in-progress
 * download survives navigation, which matters when a member starts a save and
 * then keeps browsing.
 */
export async function saveSermonOffline(audioUrl: string): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) return false;

  return new Promise<boolean>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type !== "SERMON_DOWNLOADED" || data.url !== audioUrl) return;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
      resolve(Boolean(data.ok));
    };

    // A large sermon on a weak connection can legitimately take minutes; this
    // only guards against the worker dying mid-download and never replying.
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      resolve(false);
    }, 10 * 60 * 1000);

    navigator.serviceWorker.addEventListener("message", onMessage);
    registration.active!.postMessage({ type: "DOWNLOAD_SERMON", url: audioUrl });
  });
}

/** Frees the space again. */
export async function removeSermonOffline(audioUrl: string): Promise<void> {
  if (!isServiceWorkerSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: "REMOVE_SERMON", url: audioUrl });
}
