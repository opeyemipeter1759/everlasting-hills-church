import type { ProgramAccent } from "@/lib/programs";

/**
 * The Programs palette, from the brand system. Burgundy is a sparse accent;
 * gold only ever marks small things (a scripture reference, the live ring).
 * Each accent tints a program's typographic cover: `glow` for the frosted
 * panel, `ink` for the name set on it (kept dark enough for AA on white).
 */
export const BRAND = {
  void: "#080808",
  burgundy: "#87102C",
  deepBurgundy: "#4a0819",
  crimson: "#8B1A3A",
  gold: "#C8A04A",
  chip: "#FFE8ED",
  pinkBorder: "#E7CDD3",
  blush: "#FBEAF0",
} as const;

export const ACCENT: Record<ProgramAccent, { glow: string; ink: string; label: string }> = {
  BURGUNDY: { glow: "135,16,44", ink: BRAND.burgundy, label: "Burgundy" },
  CRIMSON: { glow: "139,26,58", ink: BRAND.crimson, label: "Crimson" },
  DEEP_BURGUNDY: { glow: "74,8,25", ink: BRAND.deepBurgundy, label: "Deep burgundy" },
  GOLD: { glow: "200,160,74", ink: "#6B5216", label: "Gold" },
};

/** The two Programs typefaces, set up in app/(public)/programs/layout.tsx. */
export const SERIF = "[font-family:var(--font-programs-serif)]";
export const SANS = "[font-family:var(--font-programs-sans)]";

export const TYPE_LABEL: Record<string, string> = {
  PRAYER: "Prayer",
  PROPHETIC: "Prophetic",
  CONSECRATION: "Consecration",
  CONFERENCE: "Conference",
  HOLY_GHOST: "Holy Ghost",
  OTHER: "Gathering",
};

/** The shared ease for every Programs motion. */
export const EASE = [0.22, 1, 0.36, 1] as const;
