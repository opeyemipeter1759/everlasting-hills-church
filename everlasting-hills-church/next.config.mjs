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
  // Only install the small, app-shell assets needed to launch the PWA. Without
  // an allow-list Serwist sweeps every file under public/, which currently
  // includes tens of megabytes of gallery photography.
  globPublicPatterns: [
    "favicon/**/*.{ico,png,webmanifest}",
    "icons/**/*.{png,svg}",
    "log.png",
    "logo*.png",
  ],
  // Sermon audio/video are large and must never enter the precache manifest.
  // The runtime NetworkOnly rule in app/sw.ts covers requests; this covers the
  // build-time manifest, which would otherwise sweep in anything under public/.
  exclude: [/\.(?:mp3|m4a|aac|ogg|wav|mp4|webm|m3u8)$/i, /\/_next\/static\/media\/.*\.(mp3|mp4)$/i],
});

/**
 * One id per build, known to both the server and the browser, so an open app
 * can tell when a newer version has been deployed (see VersionWatcher).
 */
const BUILD_ID = process.env.BUILD_ID || process.env.K_REVISION || String(Date.now());

/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => BUILD_ID,
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  // `next dev` gets its own build folder. In Next 14 dev and `next build` both
  // write to .next, so building (or `npm start`) while dev is running corrupts
  // each other's output — stale pages, missing chunks, "works in dev, not in
  // start". Separate folders let both run side by side.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

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
      // Unsplash photography (picnic page) — free licence, hotlinked as Unsplash asks.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Keep one canonical host so session cookies and sign-in state don't split
  // between the apex and www origins. /api is excluded: redirecting a fetch
  // to another origin makes the browser report it as a CORS failure.
  // Temporary (307) until www is proven — browsers cache permanent redirects.
  async redirects() {
    return [
      {
        source: "/:path((?!api(?:/|$)).*)",
        has: [{ type: "host", value: "everlastinghills.church" }],
        destination: "https://www.everlastinghills.church/:path",
        permanent: false,
      },
      // Keep old bookmarks/search results working after the beliefs → cultures rename.
      { source: "/beliefs", destination: "/cultures", permanent: true },
      { source: "/marriage/pre-marital-counselling", destination: "/pre-marital-counselling", permanent: false },
      // The old emailed upload page; couples now upload on their dashboard.
      { source: "/pre-marital-counselling/documents", destination: "/login", permanent: false },
    ];
  },

  // The couple dashboard: never cached, never indexed.
  async headers() {
    return [
      {
        source: "/couple-dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },

  // Don't generate browser source maps for production — smaller bundle, faster cold start.
  productionBrowserSourceMaps: false,

  // Standalone output — smaller Docker image, faster cold starts on Cloud Run.
  output: 'standalone',
};

export default withSerwist(nextConfig);
