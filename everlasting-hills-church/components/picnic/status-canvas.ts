"use client";

/** Small canvas helpers for the picnic status card. */

/** A font stack from one of the site's next/font CSS variables. */
export function cssFont(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/** Load an image; `cors` for other origins (Unsplash sends CORS headers, so the canvas stays exportable). */
export function loadImage(src: string, cors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/** Like CSS object-fit: cover, biased slightly above centre (faces sit high in most photos). */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) * 0.35, sw, sh, x, y, w, h);
}

/** Red gingham: two translucent stripe sets over cream, so the crossings read darker. */
export function gingham(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, size = 36) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#FBF6EE";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(135,16,44,0.5)";
  for (let cx = x; cx < x + w; cx += size * 2) ctx.fillRect(cx, y, size, h);
  for (let cy = y; cy < y + h; cy += size * 2) ctx.fillRect(x, cy, w, size);
  ctx.restore();
}

/** Rounded-rectangle path (begins a new path; caller fills, strokes or clips). */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
