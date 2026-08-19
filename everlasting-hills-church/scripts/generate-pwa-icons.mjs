/**
 * Generates the PWA icon set from the existing mountain logomark.
 *
 *   node scripts/generate-pwa-icons.mjs
 *
 * Source is public/logoblack.png (dark mountain on white). It is converted to a
 * white mountain on the brand's deep-black base rather than used as-is, because
 * the pre-existing public/favicon/android-chrome-*.png are a white mark on a
 * transparent background, which renders invisibly on a light home screen.
 *
 * Two purposes are emitted, and they are NOT interchangeable:
 *
 *   "any"      — the mark fills ~78% of the canvas. Used as-is by the browser.
 *   "maskable" — the mark fills ~56% of the canvas. Android crops maskable icons
 *                to a platform shape (circle, squircle, teardrop) and only the
 *                middle 80% diameter is guaranteed visible. Shipping an "any"
 *                icon as maskable is what produces those clipped logos on
 *                Android home screens.
 *
 * Output is committed to public/icons/. Re-run only if the logomark changes.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "logoblack.png");
const OUT = path.join(ROOT, "public", "icons");

/** brand.black / church.dark from tailwind.config.ts */
const BG = { r: 10, g: 10, b: 10, alpha: 1 };

/**
 * Builds a white silhouette of the logomark with a real alpha channel.
 *
 * The source is a near-black mark on a TRANSPARENT field (RGB mean ~7, alpha
 * mean ~50), so the silhouette lives in the alpha channel, not in luminance.
 * Deriving the mask from greyscale would read the transparent field as black,
 * negate it to white, and yield a fully opaque square with a faint mountain.
 *
 * So: resize over a transparent background, pull channel 3 (alpha) as the
 * shape, then join it onto a solid white image AS its alpha channel. Result is
 * white pixels where the mountain is and transparent everywhere else.
 */
async function whiteSilhouette(size) {
  const alpha = await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel(3)
    .raw()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .joinChannel(alpha, { raw: { width: size, height: size, channels: 1 } })
    .png()
    .toBuffer();
}

async function icon(size, coverage, outfile) {
  const inner = Math.round(size * coverage);
  const logo = await whiteSilhouette(inner);
  const offset = Math.round((size - inner) / 2);

  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(path.join(OUT, outfile));

  console.log(`  ${outfile.padEnd(28)} ${size}x${size}  mark ${Math.round(coverage * 100)}%`);
}

await mkdir(OUT, { recursive: true });
console.log("generating PWA icons from public/logoblack.png");

// purpose: any
await icon(192, 0.78, "icon-192.png");
await icon(512, 0.78, "icon-512.png");

// purpose: maskable — inset well inside the 80% safe zone
await icon(192, 0.56, "icon-maskable-192.png");
await icon(512, 0.56, "icon-maskable-512.png");

// iOS home screen. Never transparent and never maskable: iOS applies its own
// corner radius and composites any transparency onto black.
await icon(180, 0.72, "apple-touch-icon.png");

console.log("done");
