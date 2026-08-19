import withSerwistInit from "@serwist/next";

/**
 * Service worker. Serwist compiles app/sw.ts (TypeScript, with our own push and
 * notificationclick handlers) into public/sw.js at build time and injects the
 * precache manifest.
 *
 * Disabled in development: a service worker that precaches on every hot reload
 * makes local changes appear not to apply, which costs more time than the
 * offline behaviour it would exercise. Verify PWA behaviour against a
 * production build (`npm run build && npm start`).
 */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Sermon audio/video are large and must never enter the precache manifest.
  // The runtime NetworkOnly rule in app/sw.ts covers requests; this covers the
  // build-time manifest, which would otherwise sweep in anything under public/.
  exclude: [/\.(?:mp3|m4a|aac|ogg|wav|mp4|webm|m3u8)$/i, /\/_next\/static\/media\/.*\.(mp3|mp4)$/i],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Whitelist external image hosts so <Image /> can load them in production.
  // Wildcards are required because Cloudflare R2 public URLs use per-bucket subdomains
  // (pub-XXXX.r2.dev) and Supabase storage uses per-project subdomains.
  images: {
    remotePatterns: [
      // Cloudflare R2 public buckets (sermon thumbnails + audio assets)
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      // Supabase storage (member avatars, etc.)
      { protocol: "https", hostname: "**.supabase.co" },
      // YouTube thumbnails (if videoUrl points at YouTube)
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },

  // Don't generate browser source maps for production — smaller bundle, faster cold start.
  productionBrowserSourceMaps: false,
};

export default withSerwist(nextConfig);
