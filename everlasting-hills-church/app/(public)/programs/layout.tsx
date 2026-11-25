import localFont from "next/font/local";

/**
 * The Programs pages' two typefaces: DM Serif Display for names and headlines,
 * Instrument Sans for everything else. Self-hosted from app/fonts, like the
 * root layout's fonts (next/font/google fails at build time here).
 */
const serif = localFont({ src: "../../fonts/dm-serif-display.woff2", weight: "400", variable: "--font-programs-serif", display: "swap" });
const sans = localFont({ src: "../../fonts/instrument-sans.woff2", weight: "400 700", variable: "--font-programs-sans", display: "swap" });

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable} [font-family:var(--font-programs-sans)]`}>{children}</div>;
}
