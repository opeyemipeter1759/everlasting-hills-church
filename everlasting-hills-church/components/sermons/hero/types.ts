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

export const DEFAULT_SERMON_IMAGE =
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80";

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
