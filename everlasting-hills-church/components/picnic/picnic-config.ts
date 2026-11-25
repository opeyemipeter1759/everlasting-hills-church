/**
 * Everything the picnic page says about the day. Edit here — the page, the
 * share image and the metadata all read from this file.
 *
 * Registration is the existing gift exchange & picnic sign-up
 * (POST /gift-exchange/register with picnic: true), so entries show up in the
 * admin Gift exchange list under "Picnic".
 */

export const PICNIC = {
  title: "The EHC Picnic",
  /** Leave null until confirmed; the page shows "Venue to be announced". */
  venue: null as string | null,
  /** e.g. "From 2:00 PM". Leave null until confirmed. */
  time: null as string | null,
  path: "/picnic",
};

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Free Unsplash photographs (unsplash.com/license). Credit is shown at the foot of the page. */
export const PHOTOS = {
  hero: {
    src: unsplash("1625283518288-00362afc8663"),
    alt: "Four friends lying on a picnic blanket, laughing",
    by: "Simi Iluyomade",
    page: "https://unsplash.com/photos/friends-laughing-together-on-picnic-blanket-tvbxqXI5mmo",
  },
  family: {
    src: unsplash("1668965450077-1d23194b5f86"),
    alt: "Women and children sitting together on the grass under palm trees",
    by: "Tales",
    page: "https://unsplash.com/s/photos/african-picnic",
  },
  reading: {
    src: unsplash("1729571598934-bfe353b58fea", 1000),
    alt: "Friends resting on a blue checked blanket under the trees",
    by: "Michael Kyule",
    page: "https://unsplash.com/s/photos/african-picnic",
  },
  gingham: {
    src: unsplash("1731186622228-38f68d3f64ad", 1000),
    alt: "A red gingham picnic blanket with a basket, glasses and snacks",
    by: "Kyrie Isaac",
    page: "https://unsplash.com/photos/a-picnic-blanket-with-food-and-drinks-on-it-8GLhNBMa7OA",
  },
  fruit: {
    src: unsplash("1785175659769-f5ba232a0a90", 1000),
    alt: "Grapes, apples, flowers and a sun hat on a picnic blanket",
    by: "Sou Jest",
    page: "https://unsplash.com/photos/picnic-blanket-with-grapes-apples-hat-and-flowers-on-grass-R6QLiEQwROc",
  },
  park: {
    src: unsplash("1792868769292-f82c526bc029", 2000),
    alt: "A sunny park with acacia trees by the water",
    by: "Samina Musharraf",
    page: "https://unsplash.com/photos/dirt-path-through-grassy-lakeside-park-AFHPHSU7V4I",
  },
} as const;

const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/**
 * The picnic day: the first Sunday of December (Lagos), rolling to next year once
 * this year's has passed — same rule as the backend's giftExchangeTarget. Signed-in
 * members get the server's date (which an admin can override) instead.
 */
export function picnicDate(now: Date = new Date()): Date {
  const firstSunday = (year: number) => {
    const dec1 = new Date(Date.UTC(year, 11, 1));
    const day = (7 - dec1.getUTCDay()) % 7;
    return new Date(Date.UTC(year, 11, 1 + day) - LAGOS_OFFSET_MS); // 00:00 Lagos
  };
  const year = new Date(now.getTime() + LAGOS_OFFSET_MS).getUTCFullYear();
  const thisYear = firstSunday(year);
  return now.getTime() < thisYear.getTime() + 24 * 60 * 60 * 1000 ? thisYear : firstSunday(year + 1);
}

export function formatPicnicDate(d: Date) {
  const opts = { timeZone: "Africa/Lagos" } as const;
  return {
    weekday: d.toLocaleDateString("en-GB", { ...opts, weekday: "long" }),
    weekdayShort: d.toLocaleDateString("en-GB", { ...opts, weekday: "short" }),
    day: d.toLocaleDateString("en-GB", { ...opts, day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { ...opts, month: "long" }),
    monthShort: d.toLocaleDateString("en-GB", { ...opts, month: "short" }),
    year: d.toLocaleDateString("en-GB", { ...opts, year: "numeric" }),
    long: d.toLocaleDateString("en-GB", { ...opts, weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
}
