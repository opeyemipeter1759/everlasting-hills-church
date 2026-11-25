/**
 * Getting any picture ready for the image upload endpoints.
 *
 * - pastedImage(): the image on the clipboard (Ctrl/Cmd+V of a screenshot or a
 *   copied picture), as a File.
 * - prepareImage(): accepts any image type. JPG, PNG, WebP, GIF and AVIF go
 *   up as they are; anything else the browser can read (SVG, BMP, ICO, and
 *   HEIC/TIFF on Safari) is redrawn as PNG; HEIC/HEIF/TIFF the browser can't
 *   read are sent as they are for the server to convert. Pictures over the
 *   8 MB limit are scaled down and saved as JPEG.
 */

const WEB_READY = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const SERVER_CONVERTS = ["image/heic", "image/heif", "image/tiff"];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 4000;

const BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", jfif: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  avif: "image/avif", heic: "image/heic", heif: "image/heif", tif: "image/tiff", tiff: "image/tiff", bmp: "image/bmp",
  svg: "image/svg+xml", ico: "image/x-icon",
};

/** The file's image type, from the browser or (when it gives none) the file name. */
export function imageTypeOf(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (file.type || BY_EXTENSION[ext] || "").toLowerCase();
}

/** Every image on the clipboard (a screenshot, or pictures copied from a folder); empty for plain text. */
export function pastedImages(e: { clipboardData: DataTransfer | null }): File[] {
  const files: File[] = [];
  for (const item of Array.from(e.clipboardData?.items ?? [])) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (!file) continue;
    const ext = item.type.split("/")[1]?.replace("+xml", "") || "png";
    const name = file.name && file.name !== "image.png" ? file.name : `pasted-${Date.now()}-${files.length + 1}.${ext}`;
    files.push(new File([file], name, { type: item.type }));
  }
  return files;
}

/** The first image on the clipboard, or null when the paste is plain text. */
export const pastedImage = (e: { clipboardData: DataTransfer | null }): File | null => pastedImages(e)[0] ?? null;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

/** Redraw the picture on a canvas: PNG keeps transparency; JPEG when PNG would be too big. */
async function redraw(file: File, preferJpeg: boolean): Promise<File> {
  const img = await loadImage(file);
  const w = img.naturalWidth || 1200;
  const h = img.naturalHeight || 1200;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("unreadable");
  if (preferJpeg) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const encode = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = preferJpeg ? null : await encode("image/png");
  if (!blob || blob.size > MAX_BYTES) {
    if (!preferJpeg) {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (const quality of [0.9, 0.8, 0.7, 0.6]) {
      blob = await encode("image/jpeg", quality);
      if (blob && blob.size <= MAX_BYTES) break;
    }
  }
  if (!blob) throw new Error("unreadable");
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const type = blob.type || "image/png";
  return new File([blob], `${base}.${type === "image/jpeg" ? "jpg" : "png"}`, { type });
}

/** Any picture in, one the upload endpoint takes out. Throws a readable message when it can't. */
export async function prepareImage(file: File): Promise<File> {
  const type = imageTypeOf(file);
  if (WEB_READY.includes(type) && file.size <= MAX_BYTES) {
    return file.type ? file : new File([file], file.name, { type });
  }
  try {
    return await redraw(file, WEB_READY.includes(type) && type !== "image/png");
  } catch {
    if (SERVER_CONVERTS.includes(type) && file.size <= MAX_BYTES) return new File([file], file.name, { type });
    if (file.size > MAX_BYTES) throw new Error("That picture is over 8 MB and couldn't be shrunk. Try a smaller one.");
    throw new Error("That file isn't a picture this browser can read. Try JPG or PNG.");
  }
}
