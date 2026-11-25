import { formatPicnicDate } from "./picnic-config";

/**
 * The picnic page's words, editable in Dashboard → Public Site (CMS) → Picnic.
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
  games?: { name: string; description: string; forWho?: string | null }[];
  bring: string[];
  bringClose: string;
  rsvpTitle: string;
  rsvpBody: string;
}

export const PICNIC_FALLBACK: PicnicContent = {
  kicker: "Everlasting Hills Church · End-of-year picnic",
  headline: "Pack a blanket.",
  headlineMiddle: "We're having",
  headlineAccent: "a picnic.",
  intro:
    "One unhurried Sunday afternoon to close the year — good food, open grass, games for the children, and the whole church family in one place.",
  date: null,
  time: null,
  venue: null,
  afternoonKicker: "The afternoon",
  afternoonTitle: "Nothing fancy. Just us, outside.",
  familyNote: "Aunties, uncles, little ones — everybody's invited.",
  afternoon: [
    { title: "Food to share", body: "Coolers, plates, something from your kitchen if you'd like to bring it. Nobody goes home hungry." },
    { title: "Games on the grass", body: "Something for the children, and something for the ones who still think they can win a race." },
    { title: "The gift exchange", body: "Signed up for the gift exchange? This is where the gifts change hands." },
    { title: "Time with each other", body: "No programme to rush through. Sit, talk, laugh, pray — and meet the people you only ever wave at on Sunday." },
  ],
  verseText: "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
  verseRef: "Psalm 133:1",
  gamesKicker: "Games",
  gamesTitle: "Something for every age.",
  gamesIntro: "Join in, cheer from the blanket, or keep score. Prizes for the winners, bragging rights for everyone else.",
  games: [
    { name: "Sack race", description: "Into the sack and hop for the line. Children first, then the brave grown-ups.", forWho: "Everyone" },
    { name: "Tug of war", description: "Men against women, or one unit against another. Hold the rope; the grass is soft.", forWho: "Adults" },
    { name: "Egg-and-spoon race", description: "Steady hands win. Drop the egg and it's back to the start.", forWho: "Children" },
    { name: "Musical chairs", description: "One chair short every round, and the music stops when you least expect it.", forWho: "Everyone" },
    { name: "Ayo and Ludo", description: "Board games on the mats for anyone who would rather sit and plot.", forWho: "Everyone" },
    { name: "Five-a-side football", description: "A small pitch, small goals and very big opinions.", forWho: "Teens and adults" },
    { name: "Bible quiz", description: "Teams, a buzzer and questions from Genesis to Revelation.", forWho: "Everyone" },
    { name: "Face painting and colouring", description: "A quiet corner with crayons and colours for the little ones.", forWho: "Children" },
  ],
  bring: ["A blanket or a mat", "Something to share (if you can)", "A hat — the Ibadan sun is no joke", "Someone who needs a church family"],
  bringClose: "…and your appetite.",
  rsvpTitle: "Will we see you there?",
  rsvpBody: "Everyone is welcome — friends, family, neighbours. Leave your details so we plan enough of everything for everyone.",
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
