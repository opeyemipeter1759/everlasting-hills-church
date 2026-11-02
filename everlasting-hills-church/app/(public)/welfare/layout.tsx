import localFont from "next/font/local";

const dmSerifDisplay = localFont({
  src: [
    { path: "../../fonts/dm-serif-display.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/dm-serif-display-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--wf-serif",
  display: "swap",
});

const instrumentSans = localFont({
  src: "../../fonts/instrument-sans.woff2",
  weight: "400 700",
  variable: "--wf-sans",
  display: "swap",
});

/**
 * Scoped to /welfare only: this page's typography (DM Serif Display headings,
 * Instrument Sans body) is distinct from the rest of the public site, so the
 * fonts are loaded here rather than added to the global font stack in the
 * root layout.
 */
export default function WelfareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSerifDisplay.variable} ${instrumentSans.variable}`} style={{ fontFamily: "var(--wf-sans)" }}>
      {children}
    </div>
  );
}
