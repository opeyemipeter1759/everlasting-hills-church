import { describe, expect, it, vi } from "vitest";
import { PHOTO_MAX_EDGE, UNREADABLE, fitWithin, resizePhoto, type DrawSurface, type ResizeDeps } from "./photo-resize";

/** A canvas stand-in: records what was drawn and encodes to whatever types the "browser" supports. */
function fakeDeps(opts: { width: number; height: number; writes?: string[]; outBytes?: number; decodeFails?: boolean }) {
  const drawn: number[][] = [];
  const asked: string[] = [];
  const close = vi.fn();
  const surface: DrawSurface = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: (_s, x, y, w, h) => drawn.push([x, y, w, h]) }),
    toBlob(done, type = "image/png") {
      asked.push(type);
      const supported = (opts.writes ?? ["image/webp", "image/jpeg", "image/png"]).includes(type);
      done(new Blob([new Uint8Array(opts.outBytes ?? 1200)], { type: supported ? type : "image/png" }));
    },
  };
  const deps: ResizeDeps = {
    decode: async () => {
      if (opts.decodeFails) throw new Error("decode error");
      return { width: opts.width, height: opts.height, source: {} as CanvasImageSource, close };
    },
    surface: () => surface,
  };
  return { deps, surface, drawn, asked, close };
}

const phonePhoto = new Blob([new Uint8Array(3_000_000)], { type: "image/jpeg" });

describe("fitWithin", () => {
  it.each([
    [{ width: 4032, height: 3024 }, { width: 1024, height: 768 }],
    [{ width: 3024, height: 4032 }, { width: 768, height: 1024 }],
    [{ width: 2000, height: 2000 }, { width: 1024, height: 1024 }],
    [{ width: 1024, height: 500 }, { width: 1024, height: 500 }],
    [{ width: 640, height: 480 }, { width: 640, height: 480 }],
    [{ width: 10000, height: 3 }, { width: 1024, height: 1 }],
  ])("fits %j into %j", (input, expected) => {
    expect(fitWithin(input)).toEqual(expected);
  });

  it("refuses an image with no size", () => {
    expect(() => fitWithin({ width: 0, height: 100 })).toThrow(UNREADABLE);
    expect(() => fitWithin({ width: Number.NaN, height: 100 })).toThrow(UNREADABLE);
  });
});

describe("resizePhoto", () => {
  it("draws a phone photo at 1024 px on its long side and returns WebP", async () => {
    const { deps, surface, drawn, close } = fakeDeps({ width: 4032, height: 3024 });
    const out = await resizePhoto(phonePhoto, deps);

    expect([surface.width, surface.height]).toEqual([PHOTO_MAX_EDGE, 768]);
    expect(drawn).toEqual([[0, 0, 1024, 768]]);
    expect(out.type).toBe("image/webp");
    expect(close).toHaveBeenCalled();
  });

  it("returns new canvas pixels, never the original file, so EXIF and GPS cannot come along", async () => {
    const { deps } = fakeDeps({ width: 800, height: 600 });
    const out = await resizePhoto(phonePhoto, deps);
    expect(out).not.toBe(phonePhoto);
    expect(out.size).toBe(1200);
  });

  it("falls back to JPEG where the browser cannot write WebP", async () => {
    const { deps, asked } = fakeDeps({ width: 800, height: 600, writes: ["image/jpeg", "image/png"] });
    const out = await resizePhoto(phonePhoto, deps);
    expect(asked).toEqual(["image/webp", "image/jpeg"]);
    expect(out.type).toBe("image/jpeg");
  });

  it("explains a photo it cannot open", async () => {
    const { deps } = fakeDeps({ width: 1, height: 1, decodeFails: true });
    await expect(resizePhoto(phonePhoto, deps)).rejects.toThrow(UNREADABLE);
  });

  it("refuses a result still over 5 MB", async () => {
    const { deps, close } = fakeDeps({ width: 800, height: 600, outBytes: 5 * 1024 * 1024 + 1 });
    await expect(resizePhoto(phonePhoto, deps)).rejects.toThrow(/over 5 MB/);
    expect(close).toHaveBeenCalled();
  });
});
