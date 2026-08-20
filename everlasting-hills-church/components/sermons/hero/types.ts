export type SermonHeroSlide = {
  title: string;
  speaker: string;
  scripture: string;
  description: string;
  label: string;
  image: string;
  href: string;
  slug: string;
  duration: string;
  reactions: string;
  accent?: string;
};

export const AUTO_ROTATE_MS = 7000;

// Local asset, not an external host — avoids depending on next.config.mjs's
// images.remotePatterns whitelist (an unlisted host throws at render, which is
// exactly what happened with the previous images.unsplash.com URL whenever
// there were no published sermons to fall back from).
export const DEFAULT_SERMON_IMAGE = "/HeroImages/IMG_8248.jpg";

export const FALLBACK_SLIDE: SermonHeroSlide = {
  title: "Latest sermon",
  speaker: "Everlasting Hills",
  scripture: "",
  description: "A recent message from Everlasting Hills Church.",
  label: "Latest",
  image: DEFAULT_SERMON_IMAGE,
  href: "/sermons",
  slug: "",
  duration: "",
  reactions: "0 plays",
};
