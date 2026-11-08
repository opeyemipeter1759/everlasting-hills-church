/** The night-watch theme's display serif, loaded by `fraunces` from lib/fonts/prayer-watch. */
export const serif = { fontFamily: "var(--font-fraunces), serif" };

/** Each watch hour takes its colour from the real sky at that time — dusk,
 * deep indigo, the void before dawn, first light — so colour carries the
 * schedule itself instead of decorating four otherwise-identical rows. */
export const WATCH_COLORS = [
  { bg: "#4F2E5E", text: "#fff", sub: "rgba(255,255,255,0.7)", bar: "rgba(255,255,255,0.25)" },
  { bg: "#232C52", text: "#fff", sub: "rgba(255,255,255,0.7)", bar: "rgba(255,255,255,0.25)" },
  { bg: "#0A0E1F", text: "#fff", sub: "rgba(255,255,255,0.7)", bar: "rgba(255,255,255,0.25)" },
  { bg: "#C97A3E", text: "#150E22", sub: "rgba(21,14,34,0.62)", bar: "rgba(21,14,34,0.18)" },
] as const;

export const SKY_GRADIENT = `linear-gradient(90deg, ${WATCH_COLORS[0].bg}, ${WATCH_COLORS[1].bg} 38%, ${WATCH_COLORS[2].bg} 62%, ${WATCH_COLORS[3].bg})`;

/** The sky colour for the watch at this position in the night. */
export const skyAt = (position: number) => WATCH_COLORS[position % WATCH_COLORS.length];
