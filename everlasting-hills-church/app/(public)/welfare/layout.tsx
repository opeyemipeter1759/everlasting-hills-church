import { DM_Serif_Display, Instrument_Sans } from "next/font/google";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--wf-serif",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
