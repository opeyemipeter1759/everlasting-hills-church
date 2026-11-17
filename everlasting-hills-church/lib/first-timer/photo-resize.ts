import { PHOTO_MAX_BYTES } from "./photo-schema";

/** Longest side of a stored photo. Plenty for a face, and light on mobile data. */
export const PHOTO_MAX_EDGE = 1024;
export const PHOTO_QUALITY = 0.82;

export const UNREADABLE = "This photo could not be opened. Try a JPEG or PNG.";
const UNPREPARED = "This photo could not be prepared. Try another one.";
const TOO_BIG = "This photo is still over 5 MB after resizing. Try another one.";

export interface Size {
  width: number;
  height: number;
}

/** The size to draw at: long side at most `max`, never enlarged, proportions kept. */
export function fitWithin({ width, height }: Size, max = PHOTO_MAX_EDGE): Size {
  if (!(width > 0) || !(height > 0)) throw new Error(UNREADABLE);
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export interface DecodedImage extends Size {
  source: CanvasImageSource;
  close?: () => void;
}

/** The slice of a canvas this module uses, so tests can pass a fake one. */
export interface DrawSurface {
  width: number;
  height: number;
  getContext(id: "2d"): { drawImage(source: CanvasImageSource, x: number, y: number, w: number, h: number): void } | null;
  toBlob(done: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

export interface ResizeDeps {
  decode: (file: Blob) => Promise<DecodedImage>;
  surface: () => DrawSurface;
}

const encode = (canvas: DrawSurface, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, PHOTO_QUALITY));

/**
 * Shrinks a photo to at most 1024 px on its long side and re-encodes it as
 * WebP (JPEG where the browser cannot write WebP). Only the drawn pixels
 * survive a canvas, so EXIF, including a phone's GPS position, is dropped.
 */
export async function resizePhoto(file: Blob, deps: ResizeDeps = browserDeps): Promise<Blob> {
  let image: DecodedImage;
  try {
    image = await deps.decode(file);
  } catch {
    throw new Error(UNREADABLE);
  }
  try {
    const size = fitWithin(image);
    const canvas = deps.surface();
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(UNPREPARED);
    ctx.drawImage(image.source, 0, 0, size.width, size.height);

    const webp = await encode(canvas, "image/webp");
    // Older Safari cannot write WebP and quietly returns a PNG instead; a JPEG is far smaller.
    const blob = webp?.type === "image/webp" ? webp : await encode(canvas, "image/jpeg");
    if (!blob || blob.size === 0) throw new Error(UNPREPARED);
    if (blob.size > PHOTO_MAX_BYTES) throw new Error(TOO_BIG);
    return blob;
  } finally {
    image.close?.();
  }
}

/** Decodes upright: the orientation tag is applied now, since it is dropped with the rest of EXIF. */
async function decodeInBrowser(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() };
    } catch {
      // Fall through to an <img>, which some older browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
  return { width: img.naturalWidth, height: img.naturalHeight, source: img, close: () => URL.revokeObjectURL(url) };
}

const browserDeps: ResizeDeps = {
  decode: decodeInBrowser,
  surface: () => document.createElement("canvas"),
};
