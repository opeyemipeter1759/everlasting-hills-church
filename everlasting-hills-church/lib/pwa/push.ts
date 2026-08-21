"use client";

import { apiClient } from "@/lib/api/axios";
import { isIos, isIosSafari } from "./install-state";
import { isStandalone } from "./service-worker";

/**
 * Browser-side Web Push.
 *
 * The single rule this module exists to enforce: permission is never requested
 * on load. requestAndSubscribe() runs only from a member's explicit opt-in tap,
 * after they have been told what they are opting into. A cold permission prompt
 * with no context is the fastest route to a permanent block, and a blocked
 * member cannot be re-prompted by the app at all.
 */

export type PermissionState = "unsupported" | "ios-needs-install" | "default" | "granted" | "denied";

/**
 * What the settings UI should show. The three real permission states are kept
 * distinct because they need genuinely different interfaces, and iOS Safari
 * outside an installed app is called out separately because a toggle there
 * would silently do nothing.
 */
export function getPermissionState(): PermissionState {
  if (typeof window === "undefined") return "unsupported";

  // iOS supports Web Push only for a PWA added to the home screen. In a plain
  // Safari tab the APIs may be missing entirely, or present but non-functional,
  // so this check comes before the capability check.
  if (isIos() && !isStandalone()) {
    return isIosSafari() ? "ios-needs-install" : "unsupported";
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }

  return Notification.permission as "default" | "granted" | "denied";
}

/**
 * Decodes the base64url VAPID key into the byte array applicationServerKey
 * expects.
 *
 * Explicitly backed by an ArrayBuffer: current lib.dom types require
 * Uint8Array<ArrayBuffer> for BufferSource, and a bare `new Uint8Array(n)` is
 * inferred as Uint8Array<ArrayBufferLike>, which does not satisfy it.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalised);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function getVapidKey(): Promise<string> {
  // Prefer the build-time value; fall back to the API so a key rotation does
  // not require a frontend redeploy.
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (fromEnv) return fromEnv;

  const res = await apiClient.get("/push/public-key");
  const body = res.data?.data ?? res.data;
  if (!body?.publicKey) throw new Error("Push is not configured on the server");
  return body.publicKey as string;
}

/**
 * Requests permission and registers this device.
 *
 * MUST be called from a user gesture. Returns the resulting permission state so
 * the caller can render the denied case rather than silently failing.
 */
export async function requestAndSubscribe(): Promise<PermissionState> {
  const state = getPermissionState();
  if (state === "unsupported" || state === "ios-needs-install" || state === "denied") {
    return state;
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") return permission as PermissionState;

  await subscribeCurrentDevice();
  return "granted";
}

/**
 * Creates the push subscription and stores it server-side. Safe to call again:
 * the server upserts on endpoint, and an existing browser subscription is
 * reused rather than replaced.
 */
export async function subscribeCurrentDevice(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      // Required to be true by every browser: a push that shows no notification
      // is not permitted for web apps.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(await getVapidKey()),
    }));

  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  await apiClient.post("/push/subscribe", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    userAgent: navigator.userAgent.slice(0, 400),
  });
}

/** Removes this device, both in the browser and server-side. */
export async function unsubscribeCurrentDevice(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  // Tell the server too. If this request fails the row is left behind, but the
  // next send gets a 410 from the push service and prunes it, so the state
  // converges either way.
  await apiClient.delete("/push/subscribe", { data: { endpoint } }).catch(() => undefined);
}

/** True when this device already has a live push subscription. */
export async function hasActiveSubscription(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(await registration.pushManager.getSubscription());
  } catch {
    return false;
  }
}
