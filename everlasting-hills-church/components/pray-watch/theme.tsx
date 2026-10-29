import { Fraunces, Instrument_Sans } from "next/font/google";

/** Prayer Watch's type: Fraunces for headlines, Instrument Sans for everything else. */
export const pwDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal"],
  variable: "--font-pw-display",
  display: "swap",
});

export const pwSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-pw-sans",
  display: "swap",
});

/** Wraps the Prayer Watch pages: sets the fonts and the `.pw-theme` token scope in globals.css. */
export function PrayerWatchTheme({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`pw-theme ${pwDisplay.variable} ${pwSans.variable} ${className}`}>{children}</div>;
}
