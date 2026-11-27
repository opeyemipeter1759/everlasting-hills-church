import localFont from "next/font/local";

/** The public card preview uses the Programs typefaces, so the preview matches the public page. */
const serif = localFont({ src: "../../../fonts/dm-serif-display.woff2", weight: "400", variable: "--font-programs-serif", display: "swap" });
const sans = localFont({ src: "../../../fonts/instrument-sans.woff2", weight: "400 700", variable: "--font-programs-sans", display: "swap" });

export default function ProgramsAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable}`}>{children}</div>;
}
