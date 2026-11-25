"use client";

import { PHOTOS, PICNIC, formatPicnicDate, picnicDate } from "./picnic-config";
import { cssFont, drawCover, gingham, loadImage, roundRect } from "./status-canvas";

/**
 * Draws the 1080×1920 "I'm going" card people post to their WhatsApp /
 * Instagram status, in the browser so it carries their own name.
 *
 * Reads like a printed invitation: the church lockup exactly as the navbar
 * shows it, an inset photograph, a fine gingham ribbon, the title, a ticket
 * stub with the date, and the link — inside a hairline frame.
 */

const W = 1080;
const H = 1920;
const CREAM = "#F7F0E3";
const INK = "#1B1714";
const MUTED = "rgba(27,23,20,0.55)";
const BURGUNDY = "#87102C";
const M = 64; // outer margin

export interface StatusImageInput {
  name: string | null;
  dateLong: string;
  siteHost: string;
}

export async function drawPicnicStatus({ name, siteHost }: StatusImageInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported on this device");

  await document.fonts?.ready;
  const serif = cssFont("--nf-playfair", "Georgia, serif");
  const sans = cssFont("--nf-jakarta", "Helvetica, Arial, sans-serif");
  const d = formatPicnicDate(picnicDate());
  const [photo, logo] = await Promise.all([
    loadImage(PHOTOS.hero.src.replace(/w=\d+/, "w=1600"), true),
    loadImage("/logoblack.png", false),
  ]);

  // Paper + hairline frame
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(27,23,20,0.18)";
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, W - 56, H - 56, 28);
  ctx.stroke();

  // Church lockup — same as the navbar: mark, "Everlasting Hills", "CHURCH"
  ctx.drawImage(logo, M, 78, 96, 96);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111111";
  ctx.font = `700 40px ${sans}`;
  ctx.fillText("Everlasting Hills", M + 112, 122);
  ctx.fillStyle = BURGUNDY;
  ctx.font = `600 28px ${sans}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("CHURCH", M + 112, 162);
  ctx.letterSpacing = "0px";

  // Inset photograph
  ctx.save();
  roundRect(ctx, M, 220, W - M * 2, 860, 36);
  ctx.clip();
  drawCover(ctx, photo, M, 220, W - M * 2, 860);
  ctx.restore();

  // Fine gingham ribbon tucked under the photo
  gingham(ctx, M, 1064, W - M * 2, 28, 14);

  // Title
  ctx.fillStyle = BURGUNDY;
  ctx.font = `500 46px ${sans}`;
  ctx.fillText(name ? `${name.split(/\s+/)[0]} is going to` : "I'm going to", M, 1196);
  ctx.fillStyle = INK;
  ctx.font = `600 128px ${serif}`;
  ctx.fillText("The EHC", M - 4, 1330);
  ctx.fillStyle = BURGUNDY;
  ctx.font = `600 128px ${serif}`;
  ctx.fillText("Picnic.", M - 4, 1460);

  // Ticket stub: date block + when / where
  const ty = 1530;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, M, ty, W - M * 2, 224, 24);
  ctx.fill();
  ctx.fillStyle = BURGUNDY;
  roundRect(ctx, M, ty, 196, 224, 24);
  ctx.fill();
  ctx.fillRect(M + 172, ty, 24, 224); // square off the inner edge
  ctx.fillStyle = CREAM;
  ctx.textAlign = "center";
  ctx.font = `600 24px ${sans}`;
  ctx.letterSpacing = "5px";
  ctx.fillText(d.weekdayShort.toUpperCase(), M + 98, ty + 60);
  ctx.fillText(`${d.monthShort.toUpperCase()} ${d.year}`, M + 98, ty + 190);
  ctx.letterSpacing = "0px";
  ctx.font = `600 84px ${serif}`;
  ctx.fillText(d.day, M + 98, ty + 148);
  ctx.textAlign = "left";

  // Perforation between stub and details
  ctx.strokeStyle = "rgba(27,23,20,0.2)";
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(M + 196, ty + 14);
  ctx.lineTo(M + 196, ty + 210);
  ctx.stroke();
  ctx.setLineDash([]);

  const dx = M + 236;
  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${sans}`;
  ctx.letterSpacing = "5px";
  ctx.fillText("WHEN", dx, ty + 56);
  ctx.fillText("WHERE", dx, ty + 146);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = INK;
  ctx.font = `600 36px ${sans}`;
  ctx.fillText(`${d.weekday}, ${Number(d.day)} ${d.month}${PICNIC.time ? ` · ${PICNIC.time}` : ""}`, dx, ty + 100);
  ctx.fillText(PICNIC.venue ?? "Venue to be announced", dx, ty + 190);

  // Footer: the link, centred on its own
  ctx.fillStyle = "rgba(27,23,20,0.15)";
  ctx.fillRect(M, 1800, W - M * 2, 2);
  ctx.fillStyle = BURGUNDY;
  ctx.textAlign = "center";
  ctx.font = `700 32px ${sans}`;
  ctx.fillText(`${siteHost}${PICNIC.path}`, W / 2, 1858);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image"))), "image/png"),
  );
}
