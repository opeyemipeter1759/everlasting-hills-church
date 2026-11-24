import { forwardRef } from "react";
import type { IconProps, IconWeight } from "@phosphor-icons/react/dist/lib/types";

/**
 * Two interlocking wedding rings, drawn on Phosphor's 256 grid with its stroke
 * widths and round ends, so it sits beside Phosphor icons in every weight.
 * Each ring passes over the other at one crossing (a small gap is left in the
 * ring underneath), which is what makes them read as rings rather than two
 * overlapping circles.
 */
const R = 60;
const A = { x: 100, y: 148 };
const B = { x: 156, y: 108 };
/** Where the rings cross, in degrees around each centre (SVG angles, y down). */
const UNDER_A = 19.5;
const UNDER_B = 199.5;
const STROKE: Record<IconWeight, number> = { thin: 8, light: 12, regular: 16, bold: 24, fill: 28, duotone: 16 };

/** A ring as one arc with a gap centred on `gapAt`, wide enough to clear the other ring's band. */
function ringWithGap(c: { x: number; y: number }, gapAt: number, stroke: number) {
  // Half the other band, a clear margin, then the round cap that grows back into the gap.
  // The rings cross at about 70 degrees, so the gap along this ring is a little longer.
  const half = (((stroke / 2 + 6) / Math.sin((70 * Math.PI) / 180) + stroke / 2) / R) * (180 / Math.PI);
  const at = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(c.x + R * Math.cos(rad)).toFixed(2)},${(c.y + R * Math.sin(rad)).toFixed(2)}`;
  };
  return `M${at(gapAt + half)}A${R},${R} 0 1 1 ${at(gapAt - half)}`;
}

const DISCS = `M${A.x + R},${A.y}a${R},${R} 0 1 1 ${-2 * R},0a${R},${R} 0 1 1 ${2 * R},0Z M${B.x + R},${B.y}a${R},${R} 0 1 1 ${-2 * R},0a${R},${R} 0 1 1 ${2 * R},0Z`;

export const Rings = forwardRef<SVGSVGElement, IconProps>(function Rings(
  { size = "1em", weight = "regular", color = "currentColor", mirrored = false, alt, children, style, ...rest },
  ref,
) {
  const stroke = STROKE[weight];
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      style={mirrored ? { transform: "scale(-1, 1)", ...style } : style}
      {...rest}
    >
      {alt && <title>{alt}</title>}
      {children}
      {weight === "duotone" && <path d={DISCS} fill={color} opacity={0.2} />}
      <g stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={ringWithGap(A, UNDER_A, stroke)} />
        <path d={ringWithGap(B, UNDER_B, stroke)} />
      </g>
    </svg>
  );
});
