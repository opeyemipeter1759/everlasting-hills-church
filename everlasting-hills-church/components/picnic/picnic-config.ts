/**
 * Fixed facts about the picnic: path, event, date rule and photographs. The
 * words, time and venue are edited in the CMS (see picnic-content.ts).
 *
 * Public registrations are RSVPs on the picnic event; members sign up from the
 * dashboard's Picnic & gift exchange card.
 */

export const PICNIC = {
  title: "The EHC Picnic",
  path: "/picnic",
  /** Registrations are RSVPs on this event (Dashboard → Events → RSVPs). */
  eventSlug: "ehc-picnic",
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
  unity: {
    src: "https://images.unsplash.com/photo-1652169892293-ba174ef19931?auto=format&fit=crop&w=3840&q=92",
    alt: "A picnic spread on a cream blanket — hamper, straw hat, teacups and flowers — under a blossoming tree",
    by: "Svitlana",
    page: "https://unsplash.com/photos/NjQ_gzJfeiw",
  },
} as const;

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
