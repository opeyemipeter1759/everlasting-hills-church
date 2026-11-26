import { PHOTOS } from "./picnic-config";

/**
 * The picnic's photo spots, each editable in the CMS (Picnic → Photos). A spot
 * left blank shows the page's own stock photo, so the design never has a hole.
 * Mirrors `photos` in ehc-backend/src/cms/schemas/structured/picnic.schema.ts.
 */
export type PicnicPhotoKey = "hero" | "heroSmall" | "family" | "verse" | "bring1" | "bring2" | "bring3";
export type PicnicPhotoEntry = { src?: string | null; alt?: string | null; caption?: string | null };
export type PicnicPhotos = Partial<Record<PicnicPhotoKey, PicnicPhotoEntry>>;

type Stock = (typeof PHOTOS)[keyof typeof PHOTOS];
const DEFAULTS: Record<PicnicPhotoKey, { stock: Stock; caption: string | null }> = {
  hero: { stock: PHOTOS.hero, caption: "see you on the grass" },
  heroSmall: { stock: PHOTOS.fruit, caption: null },
  family: { stock: PHOTOS.family, caption: null },
  verse: { stock: PHOTOS.unity, caption: null },
  bring1: { stock: PHOTOS.reading, caption: "slow afternoons" },
  bring2: { stock: PHOTOS.gingham, caption: "the good blanket" },
  bring3: { stock: PHOTOS.fruit, caption: "someone always brings fruit" },
};

export interface ResolvedPhoto {
  src: string;
  alt: string;
  caption: string | null;
  /** The stock photo's credit, while the stock photo is the one showing. */
  credit: { by: string; page: string } | null;
}

/** What one spot shows: the CMS photo, or the stock photo when the spot is blank. */
export function picnicPhoto(photos: PicnicPhotos | null | undefined, key: PicnicPhotoKey): ResolvedPhoto {
  const { stock, caption } = DEFAULTS[key];
  const entry = photos?.[key];
  const src = entry?.src?.trim() || stock.src;
  const isStock = src === stock.src;
  return {
    src,
    alt: entry?.alt?.trim() || (isStock ? stock.alt : ""),
    // A caption cleared in the CMS stays cleared; a spot never edited keeps the page's caption.
    caption: entry && "caption" in entry ? entry.caption?.trim() || null : caption,
    credit: isStock ? { by: stock.by, page: stock.page } : null,
  };
}

/** Same photo at another width; uploads (not Unsplash) are returned as they are. */
export const atWidth = (src: string, w: number) => (src.includes("images.unsplash.com") ? src.replace(/w=\d+/, `w=${w}`) : src);

/** Credits for every stock photo still showing, once each. */
export function stockCredits(photos: PicnicPhotos | null | undefined): { by: string; page: string }[] {
  const seen = new Set<string>();
  const out: { by: string; page: string }[] = [];
  for (const key of Object.keys(DEFAULTS) as PicnicPhotoKey[]) {
    const credit = picnicPhoto(photos, key).credit;
    if (credit && !seen.has(credit.page + credit.by)) {
      seen.add(credit.page + credit.by);
      out.push(credit);
    }
  }
  return out;
}
