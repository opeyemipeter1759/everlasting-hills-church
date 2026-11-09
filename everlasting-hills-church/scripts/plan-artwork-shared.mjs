/** Canvas, palette and SVG wrapper shared by the reading plan cover scripts. */

export const W = 800;
export const H = 400;

/** The church's palette, as used everywhere else in the dashboard. */
export const WINE = "#87102C";
export const WINE_DEEP = "#4A0817";
export const WINE_DARK = "#6E0C24";
export const CREAM = "#FFF4F6";
export const BLUSH = "#FFB3C1";
export const GOLD = "#E8B44A";

export const svg = (body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>${defs}</defs>
${body}
</svg>
`;
