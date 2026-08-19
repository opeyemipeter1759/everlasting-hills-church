/// <reference lib="webworker" />
import {
  Serwist,
  NetworkOnly,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

/** Bumped when the caching rules change, to orphan old caches deliberately. */
const V = "ehc-v1";

/**
 * Sermons the member explicitly chose to save. Deliberately NOT versioned with
 * V and never cleared on logout: a member who downloaded a sermon over costly
 * mobile data should not silently lose it because we shipped a new worker, and
 * a sermon is published teaching, not personal data.
 */
const SERMON_CACHE = "ehc-sermons-offline";

/**
 * Caching strategy, chosen per resource type rather than one blanket rule.
 *
 * The governing constraint is that this app is authenticated and multi-tenant.
 * A cache entry that outlives a logout, or that one member can read after
 * another signed out on the same device, is a data leak — so the default here
 * is NetworkOnly and anything cached is justified individually below.
 */
const runtimeCaching: RuntimeCaching[] = [
  // ── Never cached ──────────────────────────────────────────────────────────
  // Sermon audio and video. Excluded from precache and from automatic runtime
  // caching: these are tens of MB each, would evict everything else, and on a
  // metered Nigerian mobile connection an unrequested background download is a
  // real cost to the member.
  //
  // NetworkOnly here does not prevent a member from deliberately saving a
  // sermon: the DOWNLOAD_SERMON handler below writes into a separate, opt-in
  // cache, and the fallback handler checks that cache first. So playback never
  // caches by accident, but an explicitly saved sermon still plays offline.
  {
    matcher: ({ url, request }) =>
      request.destination === "audio" ||
      request.destination === "video" ||
      /\.(mp3|m4a|aac|ogg|wav|mp4|webm|m3u8)$/i.test(url.pathname),
    handler: new NetworkOnly({
      plugins: [
        {
          // Serve a deliberately saved sermon when the network is gone. Only
          // reads the opt-in cache; it never writes to it.
          handlerDidError: async ({ request }) =>
            (await caches.open(SERMON_CACHE)).match(request, { ignoreVary: true }),
        },
      ],
    }),
  },

  // Auth endpoints. Never cached under any circumstance — a cached /auth/me is
  // how one member's identity ends up rendered for the next person on a shared
  // phone, which is common here.
  {
    matcher: ({ url }) => /^\/(api\/)?(auth|login|logout|session)/.test(url.pathname),
    handler: new NetworkOnly(),
  },

  // Every mutation. A cached POST/PATCH/DELETE response is never useful and a
  // replayed one is dangerous.
  {
    matcher: ({ request }) => request.method !== "GET",
    handler: new NetworkOnly(),
  },

  // ── Stale-while-revalidate, short TTL ─────────────────────────────────────
  // Member dashboard API reads. SWR so a cold launch on a bad connection paints
  // the last known state immediately and corrects it when the network answers.
  //
  // These responses are member-specific, so the cache is keyed by user: the
  // cacheKeyWillBeUsed hook folds the current member id into the cache key,
  // meaning two members on one device never collide. The whole cache is dropped
  // on logout (see the CLEAR_CACHES message handler).
  {
    matcher: ({ url, request }) =>
      request.method === "GET" &&
      request.destination === "" &&
      /^\/api\//.test(url.pathname) &&
      !/^\/api\/(auth|login|logout|session)/.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: `${V}-member-api`,
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            const url = new URL(request.url);
            url.searchParams.set("__u", currentUserKey);
            return url.toString();
          },
        },
        // Only 200s. Without this an opaque or 401 response gets cached and then
        // served back as though it were real data.
        new CacheableResponsePlugin({ statuses: [200] }),
        // 5 minutes: long enough to survive a launch and a few taps, short
        // enough that a changed service time or a cancellation corrects quickly.
        // maxEntries caps the cache so a member who browses a lot of detail
        // pages cannot push the storage quota.
        new ExpirationPlugin({
          maxAgeSeconds: 5 * 60,
          maxEntries: 64,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },

  // ── Precache-adjacent: immutable build output ─────────────────────────────
  // Hashed Next.js assets. Content-addressed, so CacheFirst is safe forever.
  {
    matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({ cacheName: `${V}-static` }),
  },

  // Fonts and icons. Public, non-sensitive, rarely change.
  {
    matcher: ({ request, url }) =>
      request.destination === "font" ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/favicon/"),
    handler: new CacheFirst({ cacheName: `${V}-assets` }),
  },

  // Images, excluding the media already excluded above.
  {
    matcher: ({ request }) => request.destination === "image",
    handler: new StaleWhileRevalidate({ cacheName: `${V}-images` }),
  },
];

/**
 * Identifies whose cached API responses these are. Set by the app after login
 * via a postMessage; "anon" until then. Folded into the API cache key so a
 * second member signing in on the same device cannot read the first one's
 * cached dashboard.
 */
let currentUserKey = "anon";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  // Sent on login. Scopes the API cache to this member.
  if (data.type === "SET_USER") {
    currentUserKey = typeof data.userKey === "string" && data.userKey ? data.userKey : "anon";
    return;
  }

  // Sent on logout. Drops every cache that can contain member data, so the next
  // person to use this device starts clean. Static/asset caches are kept: they
  // hold nothing member-specific and re-downloading them on a slow connection
  // would be a real cost for no privacy gain.
  if (data.type === "CLEAR_CACHES") {
    currentUserKey = "anon";
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.includes("member-api") || k.includes("images"))
            .map((k) => caches.delete(k)),
        ),
      ),
    );
    return;
  }

  // Member tapped "save for offline" on a sermon. This is the only path that
  // ever writes audio to disk, and it reports progress back so the UI can show
  // something honest during what may be a slow, expensive download.
  if (data.type === "DOWNLOAD_SERMON" && typeof data.url === "string") {
    const url: string = data.url;
    event.waitUntil(
      (async () => {
        const source = event.source as Client | null;
        try {
          const response = await fetch(url, { credentials: "omit" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const cache = await caches.open(SERMON_CACHE);
          await cache.put(url, response.clone());
          source?.postMessage({ type: "SERMON_DOWNLOADED", url, ok: true });
        } catch (error) {
          source?.postMessage({
            type: "SERMON_DOWNLOADED",
            url,
            ok: false,
            error: (error as Error).message,
          });
        }
      })(),
    );
    return;
  }

  if (data.type === "REMOVE_SERMON" && typeof data.url === "string") {
    const url: string = data.url;
    event.waitUntil(
      caches.open(SERMON_CACHE).then(async (cache) => {
        await cache.delete(url, { ignoreVary: true });
        (event.source as Client | null)?.postMessage({ type: "SERMON_REMOVED", url });
      }),
    );
    return;
  }

  if (data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

// ── Push notifications (Phase 3) ────────────────────────────────────────────

/**
 * `renotify` is part of the Notifications API but missing from TypeScript's
 * NotificationOptions, so it is declared here rather than casting the whole
 * options object to `any` and losing checking on every other field.
 */
type ShowNotificationOptions = NotificationOptions & { renotify?: boolean };

interface PushPayload {
  title: string;
  body: string;
  /** In-app path to open on tap. */
  url?: string;
  tag?: string;
  /** Notification action buttons, e.g. a Join button for the prayer meeting. */
  actions?: { action: string; title: string; url?: string }[];
}

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "Everlasting Hills Church", body: event.data.text() };
  }

  const actionUrls: Record<string, string> = {};
  for (const a of payload.actions ?? []) {
    if (a.url) actionUrls[a.action] = a.url;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // Grouping key: a re-sent reminder replaces the earlier one rather than
      // stacking two identical notifications.
      tag: payload.tag,
      renotify: Boolean(payload.tag),
      data: { url: payload.url ?? "/dashboard", actionUrls },
      actions: (payload.actions ?? []).map((a) => ({ action: a.action, title: a.title })),
    } as ShowNotificationOptions),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const data = (event.notification.data ?? {}) as {
    url?: string;
    actionUrls?: Record<string, string>;
  };
  const target = (event.action && data.actionUrls?.[event.action]) || data.url || "/dashboard";

  event.waitUntil(
    (async () => {
      const targetUrl = new URL(target, self.location.origin);
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus an existing tab rather than opening a duplicate. Members keep the
      // app open; spawning a second window on every notification tap is how you
      // end up with nine copies of the dashboard.
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== targetUrl.origin) continue;
        await client.focus();
        if (clientUrl.pathname !== targetUrl.pathname && "navigate" in client) {
          await client.navigate(targetUrl.toString());
        }
        return;
      }

      await self.clients.openWindow(targetUrl.toString());
    })(),
  );
});
