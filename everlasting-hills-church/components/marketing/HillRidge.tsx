/**
 * The church's signature: the "everlasting hills" as a horizon. Three ridges
 * stack along the bottom edge of a dark hero; the front one is painted in the
 * colour of the section below, so the hero rolls into the page instead of
 * ending on a straight line. The ridges rise once on load (see `.ridge-rise`
 * in globals.css) and sit still for people who asked for less motion.
 */
export default function HillRidge({
  fill = "#ffffff",
  className = "",
}: {
  /** Colour of the section underneath — the front ridge is that section's ground. */
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 bottom-[-1px] z-[5] h-[64px] w-full sm:h-[96px] lg:h-[132px] ${className}`}
    >
      <path
        className="ridge-rise"
        style={{ animationDelay: "0ms" }}
        fill="#87102C"
        fillOpacity="0.38"
        d="M0 84C170 30 330 22 540 66S880 124 1070 58 1330 14 1440 64V160H0Z"
      />
      <path
        className="ridge-rise"
        style={{ animationDelay: "120ms" }}
        fill="#4a0819"
        fillOpacity="0.85"
        d="M0 108C210 66 430 58 650 98S1010 142 1210 90 1380 70 1440 92V160H0Z"
      />
      <path
        className="ridge-rise"
        style={{ animationDelay: "240ms" }}
        fill={fill}
        d="M0 132C250 98 490 94 730 124S1170 152 1440 110V160H0Z"
      />
    </svg>
  );
}
