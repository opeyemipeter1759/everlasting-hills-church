/**
 * Covers for the plans that read one book in a few long readings. Each column
 * is a day and each dot a chapter, so the picture is the plan itself: Genesis
 * opens with thirteen chapters, Leviticus never reads more than seven. Every
 * cover uses the same scale so the books compare. The last chapter is gold,
 * where the book ends.
 */
import { CREAM, GOLD, H, W, WINE, WINE_DEEP, svg } from "./plan-artwork-shared.mjs";

/** Chapters in each day's reading, as the generator splits each book by length. */
export const BOOK_IN_DAYS_READINGS = {
  "genesis-in-five-days": [13, 11, 7, 10, 9],
  "exodus-in-five-days": [9, 8, 8, 7, 8],
  "leviticus-in-five-days": [7, 6, 4, 6, 4],
  "numbers-in-five-days": [6, 7, 7, 8, 8],
  "deuteronomy-in-five-days": [5, 7, 9, 7, 6],
};

export function bookInDaysCover(slug) {
  const readings = BOOK_IN_DAYS_READINGS[slug];
  if (!readings) throw new Error(`No readings for ${slug}`);
  const total = readings.reduce((sum, n) => sum + n, 0);

  // Right of centre and clear of the bottom, where the plan card lays its title.
  const left = 400;
  const right = W - 60;
  const baseline = H - 112;
  const gap = 16.5;
  const r = 5.5;
  const columnW = (right - left) / readings.length;

  const dots = [];
  let chapter = 0;
  readings.forEach((count, day) => {
    const cx = left + columnW * day + columnW / 2;
    for (let k = 0; k < count; k += 1) {
      chapter += 1;
      const last = chapter === total;
      dots.push(
        `<circle cx="${cx.toFixed(1)}" cy="${(baseline - k * gap).toFixed(1)}" r="${last ? r + 2.5 : r}" fill="${last ? GOLD : CREAM}" fill-opacity="${last ? 1 : (0.5 + day * 0.1).toFixed(2)}"/>`,
      );
    }
  });

  return svg(
    `<rect width="${W}" height="${H}" fill="url(#book)"/>
  <line x1="${left - 6}" y1="${baseline + 18}" x2="${right + 6}" y2="${baseline + 18}" stroke="${CREAM}" stroke-opacity="0.25" stroke-width="1.5"/>
  <g>${dots.join("\n  ")}</g>`,
    `<linearGradient id="book" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${WINE}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </linearGradient>`,
  );
}
