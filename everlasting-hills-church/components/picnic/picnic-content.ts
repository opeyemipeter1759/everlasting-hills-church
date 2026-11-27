import { formatPicnicDate } from "./picnic-config";
import type { PicnicPhotos } from "./picnic-photos";

/**
 * The picnic page's words and photos, editable in Dashboard → Public Site (CMS) → Picnic.
 * Mirrors ehc-backend/src/cms/schemas/structured/picnic.schema.ts. The fallback
 * is the original copy, shown if the CMS is unreachable or never edited.
 */
export interface PicnicContent {
  kicker: string;
  headline: string;
  headlineMiddle: string;
  headlineAccent: string;
  intro: string;
  /** YYYY-MM-DD (Lagos); blank until fixed. */
  date?: string | null;
  time?: string | null;
  venue?: string | null;
  afternoonKicker: string;
  afternoonTitle: string;
  familyNote: string;
  afternoon: { title: string; body: string }[];
  verseText: string;
  verseRef: string;
  gamesKicker?: string;
  gamesTitle?: string;
  gamesIntro?: string;
  /** Any number; older saved content may not have them yet. */
  games?: { name: string; description: string; forWho?: string | null; image?: string | null }[];
  bring: string[];
  bringClose: string;
  rsvpTitle: string;
  rsvpBody: string;
  /** Words drifting along the strip under the hero. */
  vibes?: string[];
  /** Blank spots show the page's own photos (picnic-photos.ts). */
  photos?: PicnicPhotos;
}

export const PICNIC_FALLBACK: PicnicContent = {
  kicker: "Everlasting Hills Church · End-of-year hangout",
  headline: "Grab a mat.",
  headlineMiddle: "Bring friends.",
  headlineAccent: "Let's hang out.",
  intro:
    "One long, easy afternoon to close the year. Music playing, jollof going round, games on the grass and nowhere else to be. Come as you are, stay as long as you like.",
  date: null,
  time: null,
  venue: null,
  afternoonKicker: "The vibe",
  afternoonTitle: "Good food, good music, good people.",
  familyNote: "Aunties, uncles, little ones. Bring them all.",
  afternoon: [
    { title: "Food going round", body: "Jollof, small chops, chilled drinks and whatever you bring from your kitchen. Nobody leaves hungry." },
    { title: "Music all afternoon", body: "A playlist that keeps the mood easy, and a few songs everyone knows the words to. Requests welcome." },
    { title: "Games on the grass", body: "Something for the children, and something for the grown-ups who still think they can win a race." },
    { title: "The gift exchange", body: "Signed up for the gift exchange? This is where the gifts change hands." },
    { title: "Gist and catch-up", body: "No programme to rush through. Pull up a chair, laugh, pray, and finally talk to the people you only wave at on Sunday." },
  ],
  verseText: "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
  verseRef: "Psalm 133:1",
  gamesKicker: "Games",
  gamesTitle: "Join in, or just cheer.",
  gamesIntro: "Play, cheer from the mat or keep score. Prizes for the winners, bragging rights for everyone else.",
  games: [
    { name: "Sack race", description: "Into the sack and hop for the line. Children first, then the brave grown-ups.", forWho: "Everyone", image: "https://images.unsplash.com/photo-1756113438470-2b1f166801b4?auto=format&fit=crop&w=800&q=80" },
    { name: "Tug of war", description: "Men against women, or one unit against another. Hold the rope; the grass is soft.", forWho: "Adults", image: "https://images.unsplash.com/photo-1748698534410-867798220fa8?auto=format&fit=crop&w=800&q=80" },
    { name: "Egg-and-spoon race", description: "Steady hands win. Drop the egg and it's back to the start.", forWho: "Children", image: null },
    { name: "Musical chairs", description: "One chair short every round, and the music stops when you least expect it.", forWho: "Everyone", image: "https://images.unsplash.com/photo-1603501266047-f4a2f093503b?auto=format&fit=crop&w=800&q=80" },
    { name: "Ayo and Ludo", description: "Board games on the mats for anyone who would rather sit and plot.", forWho: "Everyone", image: "https://images.unsplash.com/photo-1761716475708-ef98183ccb62?auto=format&fit=crop&w=800&q=80" },
    { name: "Five-a-side football", description: "A small pitch, small goals and very big opinions.", forWho: "Teens and adults", image: "https://images.unsplash.com/photo-1622659097509-4d56de14539e?auto=format&fit=crop&w=800&q=80" },
    { name: "Bible quiz", description: "Teams, a buzzer and questions from Genesis to Revelation.", forWho: "Everyone", image: null },
    { name: "Face painting and colouring", description: "A quiet corner with crayons and colours for the little ones.", forWho: "Children", image: "https://images.unsplash.com/photo-1764662367028-9d70a9942d95?auto=format&fit=crop&w=800&q=80" },
  ],
  bring: ["A mat, a blanket or a camping chair", "Something to share, if you can", "A hat and sunglasses (the Ibadan sun is no joke)", "Your playlist requests", "A friend who needs a church family"],
  bringClose: "…and your best gist.",
  rsvpTitle: "You coming through?",
  rsvpBody: "Everyone's welcome: friends, family, neighbours. Tell us you're coming so there's enough food to go round.",
  vibes: ["Good music", "Jollof", "Suya", "Small chops", "Chilled drinks", "Games on the grass", "Gist", "Gift exchange", "Sunshine", "The whole family"],
};

export function isPicnicContent(c: unknown): c is PicnicContent {
  const v = c as PicnicContent;
  return Boolean(v && v.headline && v.intro && Array.isArray(v.afternoon) && Array.isArray(v.bring) && v.verseText);
}

/** The picnic day (midnight, Lagos) from the CMS date, or null while it is to be announced. */
export function picnicDay(date?: string | null): Date | null {
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00+01:00`) : null;
}

export const TBA_DATE = "Date to be announced";

/** What the ticket stubs and "When" lines show: the picnic date, or placeholders while it is to be announced. */
export function dateParts(date?: string | null) {
  const day = picnicDay(date);
  if (!day) return { iso: null, top: "Date", big: "TBA", bottom: "Soon", year: "", when: TBA_DATE, long: null };
  const d = formatPicnicDate(day);
  const when = `${d.weekday}, ${Number(d.day)} ${d.month}`;
  return { iso: day.toISOString(), top: d.weekdayShort, big: d.day, bottom: d.monthShort, year: d.year, when, long: d.long };
}
export type DateParts = ReturnType<typeof dateParts>;

/** Time and venue as the page shows them; blank = not confirmed yet. */
export const venueLabel = (venue?: string | null) => venue?.trim() || "Venue to be announced";
export const timeSuffix = (time?: string | null) => (time?.trim() ? ` · ${time.trim()}` : "");
