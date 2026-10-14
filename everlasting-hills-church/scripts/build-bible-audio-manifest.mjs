/**
 * Builds the chapter-by-chapter audio manifest for the World English Bible.
 *
 *   node scripts/build-bible-audio-manifest.mjs
 *
 * The recordings are Winfred W. Henson's reading of the World English Bible,
 * hosted by eBible.org at https://ebible.org/eng-web/audio/ and released into
 * the public domain ("may be downloaded, copied, and listened to freely").
 * Their file names differ from book to book, so this reads each book's folder
 * listing, keeps the order eBible.org lists them in, and refuses to write
 * anything unless every book has exactly one file per chapter.
 *
 * Writes lib/bible-audio/web-chapters.json: { "<bookId>": ["<url of chapter 1>", ...] }.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://ebible.org/eng-web/audio/";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "lib", "bible-audio", "web-chapters.json");

const CHAPTERS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5,
  48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6,
  4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22,
];

const pause = (ms) => new Promise((done) => setTimeout(done, ms));

/** Politely: one request at a time, a pause between them, backing off if refused. */
async function listing(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await pause(1500);
    const response = await fetch(url, {
      headers: { "User-Agent": "EverlastingHillsChurch-manifest/1.0 (church Bible reading app)" },
    });
    if (response.ok) return response.text();
    if (response.status !== 403 && response.status !== 429 && response.status < 500) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    await pause(attempt * 15000);
  }
  throw new Error(`${url}: still refused after 5 attempts`);
}

const UNITS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
};
const TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

/** The chapter a file name spells out after "Chapter" (or "Psalms-"), or NaN. */
function spelledChapter(name) {
  const base = name
    .replace(/\.mp3$/i, "")
    // A re-upload: "Chapter Seventeen (1)", "Chapter Thirteen 1".
    .replace(/\s*\(\d+\)$/, "")
    .replace(/([a-z])\s+\d$/i, "$1");
  const digits = base.match(/chapter[\s_-]+0*(\d{1,3})$/i);
  if (digits) return Number(digits[1]);
  const match = base.match(/(?:chapter|psalms?)[\s_-]+([a-z\s_-]+)$/i);
  if (!match) return NaN;
  let total = 0;
  let current = 0;
  for (const word of match[1].toLowerCase().split(/[\s_-]+/).filter(Boolean)) {
    if (word === "and") continue;
    if (word === "hundred") current = (current || 1) * 100;
    else if (word in TENS) current += TENS[word];
    else if (word in UNITS) current += UNITS[word];
    else return NaN;
  }
  total += current;
  return total || NaN;
}

const index = await listing(BASE);
const folders = [...index.matchAll(/href="((\d{2})_[^"/]+\/)"/g)].map((m) => ({ path: m[1], bookId: Number(m[2]) }));
const byBook = new Map(folders.map((folder) => [folder.bookId, folder.path]));
if (byBook.size !== 66) throw new Error(`Expected 66 book folders, found ${byBook.size}`);

const manifest = {};
const problems = [];
for (let bookId = 1; bookId <= 66; bookId += 1) {
  const folder = byBook.get(bookId);
  const html = await listing(BASE + folder);
  const files = [...new Set([...html.matchAll(/href="([^"]+\.mp3)"/gi)].map((m) => m[1]))];
  // Listings are not in chapter order, and the numbers in the names drift, so
  // each file is placed by the chapter it spells out: "Chapter Twenty Two",
  // "Psalms-One Hundred Fifty", "Chapter_Thirty_One".
  const chapters = new Array(CHAPTERS[bookId - 1]).fill(null);
  // Clean names first, so a re-upload is only used when it is the sole copy.
  const isVariant = (file) => /\(\d+\)\.mp3$|[a-z]\s+\d\.mp3$/i.test(decodeURIComponent(file));
  files.sort((a, b) => Number(isVariant(a)) - Number(isVariant(b)));
  for (const file of files) {
    const name = decodeURIComponent(file);
    const chapter = spelledChapter(name);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapters.length) {
      problems.push(`${folder}${name}: cannot tell which chapter this is`);
      continue;
    }
    // A second recording of the same chapter is ignored; the first listed wins.
    chapters[chapter - 1] ??= new URL(file, BASE + folder).toString();
  }
  const missing = chapters.flatMap((url, i) => (url ? [] : [i + 1]));
  if (missing.length) {
    problems.push(`${folder}: no recording for chapter ${missing.join(", ")}`);
    continue;
  }
  manifest[bookId] = chapters;
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(manifest)}\n`);
console.log(`wrote ${OUT}: ${Object.values(manifest).reduce((sum, list) => sum + list.length, 0)} chapters`);
