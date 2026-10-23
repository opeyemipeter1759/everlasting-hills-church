import { Fraunces } from "next/font/google";

/** The night-watch theme's display serif — set apart from the rest of the
 * site's Playfair Display so this feature reads as its own moment. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
