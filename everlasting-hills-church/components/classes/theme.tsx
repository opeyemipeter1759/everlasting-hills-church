import { DM_Serif_Display, Instrument_Sans } from "next/font/google";

/** The class pages' type: DM Serif Display for headlines, Instrument Sans for everything else. */
export const classDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const classSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans-class",
  display: "swap",
});

/**
 * Wraps a class page: sets the fonts and the `.ehc-class` token scope from
 * classes.md (ink, burgundy, gold, blush; glass; the EHC ease) in globals.css.
 */
export function ClassTheme({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`ehc-class ${classDisplay.variable} ${classSans.variable} ${className}`}>{children}</div>;
}

/** A headline with one italic emphasis word, the class pages' signature. */
export function EmphasisHeading({
  as: Tag = "h2",
  before,
  emphasis,
  after = "",
  className = "",
}: {
  as?: "h1" | "h2" | "h3";
  before: string;
  emphasis: string;
  after?: string;
  className?: string;
}) {
  return (
    <Tag className={`cls-display ${className}`}>
      {before} <em className="cls-em">{emphasis}</em>
      {after}
    </Tag>
  );
}
