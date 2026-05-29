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

export default nextConfig;
