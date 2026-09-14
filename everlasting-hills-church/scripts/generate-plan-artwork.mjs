/**
 * Cover art for the reading plans.
 *
 *   node scripts/generate-plan-artwork.mjs
 *
 * Writes SVGs to public/reading-plans/. Committed to the repo — this script
 * exists so the shapes can be adjusted and regenerated rather than hand edited,
 * not because anything runs it at build time.
 *
 * Three covers, one idea each, all in the church's wine and cream. They are
 * drawn rather than photographed because a stock photo of an open Bible says
 * nothing about which plan it is, and because an SVG is four kilobytes and
 * stays sharp on every screen the church actually uses.
 *
 * SVG over PNG throughout: no raster dependency, and the same file serves a
 * 120px card and a full-width header.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "reading-plans");

const W = 800;
const H = 400;

/** The church's palette, as used everywhere else in the dashboard. */
const WINE = "#87102C";
const WINE_DEEP = "#4A0817";
const WINE_DARK = "#6E0C24";
const CREAM = "#FFF4F6";
const BLUSH = "#FFB3C1";
const GOLD = "#E8B44A";

const svg = (body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>${defs}</defs>
${body}
</svg>
`;

// ── 1. Start with Jesus ──────────────────────────────────────────────────────
// A sunrise. Concentric arcs breaking over a horizon, because this plan is for
// somebody at the beginning and the Gospels are where the light comes up.
function startWithJesus() {
  const cx = W / 2;
  const horizon = H * 0.72;

  const rings = [];
  for (let i = 8; i >= 1; i -= 1) {
    const r = 42 + i * 30;
    const opacity = (0.055 + (8 - i) * 0.028).toFixed(3);
    rings.push(
      `<circle cx="${cx}" cy="${horizon}" r="${r}" fill="none" stroke="${CREAM}" stroke-opacity="${opacity}" stroke-width="${(1 + (8 - i) * 0.35).toFixed(2)}"/>`,
    );
  }

  // Rays, thinning as they go out, stopping short of the edge so the frame
  // stays calm.
  const rays = [];
  for (let i = 0; i < 13; i += 1) {
    const angle = Math.PI + (i / 12) * Math.PI;
    const inner = 58;
    const outer = 150 + (i % 3) * 46;
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = horizon + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = horizon + Math.sin(angle) * outer;
    rays.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="url(#ray)" stroke-width="${i % 2 ? 1.2 : 2.2}" stroke-linecap="round"/>`,
    );
  }

  return svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g>${rings.join("\n  ")}</g>
  <g opacity="0.75">${rays.join("\n  ")}</g>
  <circle cx="${cx}" cy="${horizon}" r="52" fill="url(#sun)"/>
  <rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="${WINE_DEEP}" fill-opacity="0.55"/>
  <line x1="0" y1="${horizon}" x2="${W}" y2="${horizon}" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="1.5"/>`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${WINE_DEEP}"/>
    <stop offset="0.62" stop-color="${WINE}"/>
    <stop offset="1" stop-color="${WINE_DARK}"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FFF8F0"/>
    <stop offset="0.55" stop-color="${GOLD}" stop-opacity="0.95"/>
    <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
  </radialGradient>
  <!-- User space, centred on the sun, so every ray fades outward the same way.
       An objectBoundingBox gradient would be degenerate on the horizontal and
       vertical rays, whose bounding box has no area, and those rays would not
       render at all. -->
  <radialGradient id="ray" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${horizon}" r="240">
    <stop offset="0.2" stop-color="${GOLD}" stop-opacity="0.85"/>
    <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
  </radialGradient>`,
  );
}

// ── 2. Know the whole story ──────────────────────────────────────────────────
// One continuous thread crossing the canvas, with a mark at each turn. Scripture
// as a single narrative rather than sixty six unrelated documents, which is the
// whole argument this plan makes.
function knowTheWholeStory() {
  const points = [];
  const count = 9;
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const x = 70 + t * (W - 140);
    // A settling wave: wide swings early, narrowing as the story resolves.
    const amplitude = 92 * (1 - t * 0.55);
    const y = H / 2 + Math.sin(t * Math.PI * 2.15) * amplitude;
    points.push([x, y]);
  }

  // A smooth path through the points, using the midpoints as curve joints so
  // the line never kinks.
  let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const cx = (px + x) / 2;
    path += ` Q ${cx.toFixed(1)} ${py.toFixed(1)} ${cx.toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
    path += ` Q ${cx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }

  const nodes = points
    .map(([x, y], i) => {
      const big = i === 0 || i === points.length - 1;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 9 : 5}" fill="${big ? GOLD : CREAM}" fill-opacity="${big ? 1 : 0.85}"/>`;
    })
    .join("\n  ");

  // Faint horizontal rules behind, like ruled paper.
  const rules = [];
  for (let y = 40; y < H; y += 28) {
    rules.push(
      `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${CREAM}" stroke-opacity="0.045" stroke-width="1"/>`,
    );
  }

  return svg(
    `<rect width="${W}" height="${H}" fill="url(#page)"/>
  <g>${rules.join("\n  ")}</g>
  <path d="${path}" fill="none" stroke="${WINE_DEEP}" stroke-opacity="0.5" stroke-width="9" stroke-linecap="round" transform="translate(0,5)"/>
  <path d="${path}" fill="none" stroke="url(#thread)" stroke-width="4.5" stroke-linecap="round"/>
  <g>${nodes}</g>`,
    `<linearGradient id="page" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${WINE}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </linearGradient>
  <linearGradient id="thread" gradientUnits="userSpaceOnUse" x1="70" y1="0" x2="${W - 70}" y2="0">
    <stop offset="0" stop-color="${GOLD}"/>
    <stop offset="0.5" stop-color="${CREAM}"/>
    <stop offset="1" stop-color="${BLUSH}"/>
  </linearGradient>`,
  );
}

// ── 3. The whole counsel ─────────────────────────────────────────────────────
// Sixty six bars, one per book, each as tall as that book has chapters. It is a
// real chart of the thing being committed to: Psalms towers, Obadiah is a mark,
// and the split between the testaments is visible without being labelled.
const CHAPTERS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5,
  48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6,
  4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22,
];
const OLD_TESTAMENT_BOOKS = 39;

function theWholeCounsel() {
  if (CHAPTERS.length !== 66) {
    throw new Error(`Expected 66 books, got ${CHAPTERS.length}`);
  }

  const padX = 48;
  const baseline = H - 62;
  const maxHeight = 250;
  const slot = (W - padX * 2) / CHAPTERS.length;
  const barWidth = Math.max(2.5, slot * 0.62);
  const tallest = Math.max(...CHAPTERS);

  const bars = CHAPTERS.map((chapters, i) => {
    // Square rooted, so Psalms at 150 does not flatten Obadiah at 1 into
    // nothing. The shape stays honest; the range becomes legible.
    const height = Math.max(4, (Math.sqrt(chapters) / Math.sqrt(tallest)) * maxHeight);
    const x = padX + i * slot + (slot - barWidth) / 2;
    const isNew = i >= OLD_TESTAMENT_BOOKS;
    return `<rect x="${x.toFixed(1)}" y="${(baseline - height).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}" rx="${(barWidth / 2).toFixed(1)}" fill="${isNew ? GOLD : CREAM}" fill-opacity="${isNew ? 0.92 : 0.78}"/>`;
  }).join("\n  ");

  const divideX = padX + OLD_TESTAMENT_BOOKS * slot - slot * 0.19;

  return svg(
    `<rect width="${W}" height="${H}" fill="url(#counsel)"/>
  <g>${bars}</g>
  <line x1="${divideX.toFixed(1)}" y1="${baseline - maxHeight - 16}" x2="${divideX.toFixed(1)}" y2="${baseline + 22}" stroke="${BLUSH}" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="3 5"/>
  <line x1="${padX}" y1="${baseline + 10}" x2="${W - padX}" y2="${baseline + 10}" stroke="${CREAM}" stroke-opacity="0.28" stroke-width="1.5"/>
  <text x="${padX}" y="${baseline + 34}" font-family="Georgia, serif" font-size="14" letter-spacing="3" fill="${CREAM}" fill-opacity="0.55">OLD</text>
  <text x="${W - padX}" y="${baseline + 34}" text-anchor="end" font-family="Georgia, serif" font-size="14" letter-spacing="3" fill="${GOLD}" fill-opacity="0.75">NEW</text>`,
    `<linearGradient id="counsel" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="${WINE_DARK}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </linearGradient>`,
  );
}

// ── The familiar shapes ─────────────────────────────────────────────────────
// Same rule as the first three: each picture is a fact about its plan.

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

// A year as a wheel: one tick per day, the twelve month starts in gold.
function bibleInAYear() {
  const cx = W * 0.62;
  const cy = H / 2;
  const ticks = [];
  for (let d = 0; d < 365; d += 1) {
    const a = -Math.PI / 2 + (d / 365) * Math.PI * 2;
    const month = DAYS_BEFORE_MONTH.includes(d);
    const r1 = month ? 108 : 124;
    const r2 = month ? 170 : 150;
    const opacity = month ? 0.95 : 0.16 + (d / 364) * 0.6;
    ticks.push(
      `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}" stroke="${month ? GOLD : CREAM}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${month ? 2.4 : 1.1}" stroke-linecap="round"/>`,
    );
  }
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#year)"/>
  <circle cx="${cx}" cy="${cy}" r="96" fill="${WINE_DEEP}" fill-opacity="0.45"/>
  <g>${ticks.join("\n  ")}</g>
  <circle cx="${cx}" cy="${cy}" r="7" fill="${GOLD}"/>`,
    `<radialGradient id="year" cx="0.62" cy="0.5" r="0.75">
    <stop offset="0" stop-color="${WINE}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </radialGradient>`,
  );
}

// Four ridges, each as tall as its section of the Old Testament has chapters:
// Law 187, History 249, Poetry 243, Prophets 250 — 929 in all.
const OT_SECTIONS = [
  ["LAW", 187],
  ["HISTORY", 249],
  ["POETRY", 243],
  ["PROPHETS", 250],
];

function oldTestamentInAYear() {
  const base = H - 58;
  const centres = [210, 360, 510, 655];
  const width = 330;
  const ridges = OT_SECTIONS.map(([label, chapters], i) => {
    const x = centres[i];
    const peak = base - (chapters / 250) * 250;
    const d = `M ${x - width / 2} ${base} L ${x - width * 0.11} ${peak + 16} Q ${x} ${peak - 8} ${x + width * 0.11} ${peak + 16} L ${x + width / 2} ${base} Z`;
    const cap = `M ${x - width * 0.075} ${peak + 26} Q ${x} ${peak - 2} ${x + width * 0.075} ${peak + 26} Q ${x} ${peak + 14} ${x - width * 0.075} ${peak + 26} Z`;
    return `<path d="${d}" fill="url(#ridge${i})"/>
  <path d="${cap}" fill="${CREAM}" fill-opacity="0.8"/>
  <text x="${x}" y="${base + 30}" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="3" fill="${CREAM}" fill-opacity="0.6">${label}</text>`;
  });
  const ridgeGradients = OT_SECTIONS.map(
    (_, i) => `<linearGradient id="ridge${i}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${i % 2 ? WINE : BLUSH}" stop-opacity="${i % 2 ? 0.95 : 0.55}"/>
    <stop offset="1" stop-color="${WINE_DEEP}" stop-opacity="0.95"/>
  </linearGradient>`,
  );
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#dusk)"/>
  <circle cx="${W - 110}" cy="86" r="30" fill="${GOLD}" fill-opacity="0.9"/>
  <g>${ridges.join("\n  ")}</g>
  <line x1="40" y1="${base}" x2="${W - 40}" y2="${base}" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="1.5"/>`,
    `<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${WINE_DEEP}"/>
    <stop offset="1" stop-color="${WINE_DARK}"/>
  </linearGradient>
  ${ridgeGradients.join("\n  ")}`,
  );
}

// Ninety days as ninety cells, brightening as the season goes on.
function newTestamentIn90Days() {
  const cols = 15;
  const cell = 26;
  const gap = 8;
  const x0 = W - (cols * (cell + gap) - gap) - 56;
  const y0 = 66;
  const cells = [];
  for (let i = 0; i < 90; i += 1) {
    const x = x0 + (i % cols) * (cell + gap);
    const y = y0 + Math.floor(i / cols) * (cell + gap);
    const last = i >= 84;
    cells.push(
      `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="6" fill="${last ? GOLD : CREAM}" fill-opacity="${(last ? 0.95 : 0.1 + (i / 89) * 0.7).toFixed(2)}"/>`,
    );
  }
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#season)"/>
  <g>${cells.join("\n  ")}</g>`,
    `<linearGradient id="season" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${WINE}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </linearGradient>`,
  );
}

// A harp of thirty strings, one for each day of the month.
function psalmsIn30Days() {
  const left = 300;
  const right = W - 70;
  const base = H - 56;
  const strings = [];
  const tops = [];
  for (let i = 0; i < 30; i += 1) {
    const t = i / 29;
    const x = left + t * (right - left);
    const top = 62 + Math.pow(t, 1.4) * 190;
    tops.push([x, top]);
    strings.push(
      `<line x1="${x.toFixed(1)}" y1="${top.toFixed(1)}" x2="${x.toFixed(1)}" y2="${base}" stroke="${GOLD}" stroke-opacity="${(i % 2 ? 0.55 : 0.9).toFixed(2)}" stroke-width="${i % 5 === 0 ? 2.2 : 1.3}"/>`,
    );
  }
  const frame = tops
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${(y - 6).toFixed(1)}`)
    .join(" ");
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#harp)"/>
  <g>${strings.join("\n  ")}</g>
  <path d="${frame}" fill="none" stroke="${CREAM}" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${left - 14}" y1="${base}" x2="${right + 14}" y2="${base}" stroke="${CREAM}" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round"/>`,
    `<linearGradient id="harp" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${WINE_DEEP}"/>
    <stop offset="1" stop-color="${WINE}"/>
  </linearGradient>`,
  );
}

// Four witnesses, each a column as tall as their book has chapters.
const GOSPEL_CHAPTERS = [
  ["MATTHEW", 28],
  ["MARK", 16],
  ["LUKE", 24],
  ["JOHN", 21],
];

function gospelsIn30Days() {
  const base = H - 64;
  const barH = 7;
  const step = 10;
  const colW = 64;
  const x0 = W - 4 * 104 - 34;
  const cols = GOSPEL_CHAPTERS.map(([name, chapters], c) => {
    const x = x0 + c * 104;
    const bars = [];
    for (let k = 0; k < chapters; k += 1) {
      const top = k === chapters - 1;
      bars.push(
        `<rect x="${x}" y="${base - (k + 1) * step}" width="${colW}" height="${barH}" rx="3" fill="${top ? GOLD : CREAM}" fill-opacity="${top ? 0.95 : (0.25 + (k / 28) * 0.55).toFixed(2)}"/>`,
      );
    }
    return `${bars.join("\n  ")}
  <text x="${x + colW / 2}" y="${base + 26}" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="2.5" fill="${CREAM}" fill-opacity="0.6">${name}</text>`;
  });
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#witness)"/>
  <g>${cols.join("\n  ")}</g>`,
    `<linearGradient id="witness" x1="0" y1="0" x2="0.5" y2="1">
    <stop offset="0" stop-color="${WINE_DARK}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </linearGradient>`,
  );
}

// A month on the wall: chapter N is the reading on day N.
function proverbsInAMonth() {
  const cell = 44;
  const gap = 8;
  const x0 = W - (7 * (cell + gap) - gap) - 64;
  const y0 = 70;
  const cells = [];
  for (let day = 1; day <= 31; day += 1) {
    const i = day - 1;
    const x = x0 + (i % 7) * (cell + gap);
    const y = y0 + Math.floor(i / 7) * (cell + gap);
    cells.push(
      `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="8" fill="${CREAM}" fill-opacity="${(0.08 + (i / 30) * 0.2).toFixed(2)}" stroke="${CREAM}" stroke-opacity="0.18"/>
  <text x="${x + cell / 2}" y="${y + cell / 2 + 6}" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="${day === 31 ? GOLD : CREAM}" fill-opacity="0.85">${day}</text>`,
    );
  }
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#month)"/>
  <g>${cells.join("\n  ")}</g>`,
    `<linearGradient id="month" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${WINE}"/>
    <stop offset="1" stop-color="${WINE_DEEP}"/>
  </linearGradient>`,
  );
}

const COVERS = {
  "start-with-jesus": startWithJesus,
  "know-the-whole-story": knowTheWholeStory,
  "the-whole-counsel": theWholeCounsel,
  "bible-in-a-year": bibleInAYear,
  "old-testament-in-a-year": oldTestamentInAYear,
  "new-testament-in-90-days": newTestamentIn90Days,
  "psalms-in-30-days": psalmsIn30Days,
  "gospels-in-30-days": gospelsIn30Days,
  "proverbs-in-a-month": proverbsInAMonth,
};

mkdirSync(OUT, { recursive: true });
for (const [slug, draw] of Object.entries(COVERS)) {
  const file = resolve(OUT, `${slug}.svg`);
  writeFileSync(file, draw(), "utf8");
  console.log(`wrote ${file}`);
}
