import type { MetadataRoute } from "next";

/**
 * Web app manifest, served at /manifest.webmanifest by Next's metadata route.
 *
 * This replaces the unused public/favicon/site.webmanifest, which had empty
 * name fields, icon paths that pointed at /android-chrome-*.png when the files
 * actually live under /favicon/, and white theme colours that fought the brand.
 * Nothing referenced it.
 *
 * start_url is the member dashboard rather than the marketing home page: the
 * installed app exists to serve members, and landing them on the public site
 * every launch would make the install feel like a bookmark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Everlasting Hills Church",
    short_name: "Everlasting Hills",
    description:
      "Services, sermons, courses and your serving schedule at Everlasting Hills Church, Ibadan.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // church.dark and brand black from tailwind.config.ts. theme_color tints the
    // Android status bar, background_color paints the splash screen before first
    // paint, so they match to avoid a flash of a different colour on launch.
    theme_color: "#0a0a0a",
    background_color: "#0a0a0a",
    categories: ["lifestyle", "education"],
    lang: "en-NG",
    dir: "ltr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Kept separate from the "any" icons on purpose. Android crops maskable
      // icons to a platform shape and only the middle 80% is guaranteed visible,
      // so these carry a wider margin. Declaring one file as both purposes is
      // what produces clipped logos on Android home screens.
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Sermons", url: "/dashboard/sermon" },
      { name: "My attendance", url: "/dashboard/attendance" },
      { name: "Notification settings", url: "/dashboard/settings/notifications" },
    ],
  };
}
