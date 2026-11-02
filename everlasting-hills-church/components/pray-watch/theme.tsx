import localFont from "next/font/local";

/** Prayer Watch's type: Fraunces for headlines, Instrument Sans for everything else. */
export const pwDisplay = localFont({
  src: "../../app/fonts/fraunces.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-pw-display",
  display: "swap",
});

export const pwSans = localFont({
  src: "../../app/fonts/instrument-sans.woff2",
  weight: "400 700",
  variable: "--font-pw-sans",
  display: "swap",
});

/** Wraps the Prayer Watch pages: sets the fonts and the `.pw-theme` token scope in globals.css. */
export function PrayerWatchTheme({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`pw-theme ${pwDisplay.variable} ${pwSans.variable} ${className}`}>{children}</div>;
}
