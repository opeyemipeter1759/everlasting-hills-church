import { describe, expect, it } from "vitest";
import { PHOTOS } from "./picnic-config";
import { atWidth, picnicPhoto, stockCredits } from "./picnic-photos";

describe("picnic photo spots", () => {
  it("shows the stock photo, its caption and its credit when the CMS has nothing", () => {
    const hero = picnicPhoto(undefined, "hero");
    expect(hero.src).toBe(PHOTOS.hero.src);
    expect(hero.caption).toBe("see you on the grass");
    expect(hero.credit?.by).toBe(PHOTOS.hero.by);
  });

  it("uses an uploaded photo, with no stock credit", () => {
    const up = "https://abc.supabase.co/storage/v1/object/public/uploads/x.jpg";
    const hero = picnicPhoto({ hero: { src: up, alt: "Our church on the grass", caption: "last year" } }, "hero");
    expect(hero).toEqual({ src: up, alt: "Our church on the grass", caption: "last year", credit: null });
  });

  it("falls back to the stock photo when the picture is cleared, and hides a cleared caption", () => {
    const spot = picnicPhoto({ bring1: { src: null, alt: null, caption: null } }, "bring1");
    expect(spot.src).toBe(PHOTOS.reading.src);
    expect(spot.caption).toBeNull();
  });

  it("credits only stock photos still showing, once each", () => {
    const all = stockCredits(undefined);
    expect(all.filter((c) => c.by === PHOTOS.fruit.by)).toHaveLength(1); // used in two spots
    const up = "https://abc.supabase.co/x.jpg";
    const fewer = stockCredits({ hero: { src: up } });
    expect(fewer.some((c) => c.by === PHOTOS.hero.by)).toBe(false);
  });

  it("resizes Unsplash photos only", () => {
    expect(atWidth(PHOTOS.hero.src, 600)).toContain("w=600");
    expect(atWidth("https://abc.supabase.co/a.jpg?w=10", 600)).toBe("https://abc.supabase.co/a.jpg?w=10");
  });
});
