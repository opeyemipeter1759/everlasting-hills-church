"use client";

import { PHOTOS, PICNIC } from "./picnic-config";

/**
 * Draws the 1080×1920 "I'm going" image people post to their WhatsApp /
 * Instagram status. Built on a canvas in the browser so it carries the
 * member's own name — no server round-trip, nothing stored.
 *
 * Layout: the hero photograph fills the top, a red gingham band tears across,
 * then a cream "invitation card" with the date, their name and the link.
 */

const W = 1080;
const H = 1920;
const CREAM = "#F7F0E3";
const INK = "#1B1714";
const BURGUNDY = "#87102C";
const GREEN = "#1E3A2A";

export interface StatusImageInput {
  name: string | null;
  dateLong: string; // "Sunday, 6 December 2026"
  siteHost: string; // "everlastinghills.church"
}

function cssFont(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Unsplash serves CORS headers, so the canvas stays exportable
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the picnic photo"));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) * 0.35, sw, sh, x, y, w, h);
}

function gingham(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, size = 36) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#FBF6EE";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(135,16,44,0.55)";
  for (let cx = x; cx < x + w; cx += size * 2) ctx.fillRect(cx, y, size, h);
  for (let cy = y; cy < y + h; cy += size * 2) ctx.fillRect(x, cy, w, size);
  ctx.restore();
}

/** Torn-paper edge across the canvas at height `y`. */
function tornEdge(ctx: CanvasRenderingContext2D, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, y);
  let seed = 7;
  for (let x = 0; x <= W; x += 18) {
    seed = (seed * 9301 + 49297) % 233280;
    ctx.lineTo(x, y + (seed / 233280) * 14 - 7);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

export async function drawPicnicStatus({ name, dateLong, siteHost }: StatusImageInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported on this device");

  await document.fonts?.ready;
  const serif = cssFont("--nf-playfair", "Georgia, serif");
  const sans = cssFont("--nf-jakarta", "Helvetica, Arial, sans-serif");
  const script = cssFont("--nf-dancing", "cursive");

  // Photo
  const photo = await loadImage(PHOTOS.hero.src.replace(/w=\d+/, "w=1400"));
  drawCover(ctx, photo, 0, 0, W, 1120);
  const shade = ctx.createLinearGradient(0, 0, 0, 360);
  shade.addColorStop(0, "rgba(0,0,0,0.45)");
  shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, 360);

  // Top lockup
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 30px ${sans}`;
  ctx.letterSpacing = "8px";
  ctx.fillText("EVERLASTING HILLS CHURCH", 80, 120);
  ctx.letterSpacing = "0px";

  // Gingham band + cream card
  gingham(ctx, 0, 1060, W, 120);
  tornEdge(ctx, 1150, CREAM);

  // Card text
  ctx.fillStyle = BURGUNDY;
  ctx.font = `700 64px ${script}`;
  ctx.fillText(name ? `${name.split(" ")[0]} is going to` : "I'm going to", 80, 1290);

  ctx.fillStyle = INK;
  ctx.font = `700 150px ${serif}`;
  ctx.fillText("The EHC", 72, 1450);
  ctx.font = `italic 700 150px ${serif}`;
  ctx.fillText("Picnic.", 72, 1600);

  ctx.fillStyle = GREEN;
  ctx.fillRect(80, 1660, 920, 3);

  ctx.fillStyle = INK;
  ctx.font = `600 44px ${sans}`;
  ctx.fillText(dateLong, 80, 1740);
  ctx.fillStyle = "rgba(27,23,20,0.6)";
  ctx.font = `500 34px ${sans}`;
  ctx.fillText(PICNIC.venue ?? "Bring a blanket. Bring a friend.", 80, 1800);
  ctx.fillStyle = BURGUNDY;
  ctx.font = `700 34px ${sans}`;
  ctx.fillText(`${siteHost}${PICNIC.path}`, 80, 1862);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image"))), "image/png"),
  );
}
