import localFont from "next/font/local";

/** The night-watch theme's display serif — set apart from the rest of the
 * site's Playfair Display so this feature reads as its own moment. */
export const fraunces = localFont({
  src: [
    { path: "../../app/fonts/fraunces.woff2", weight: "400 600", style: "normal" },
    { path: "../../app/fonts/fraunces-italic.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});
