import { z } from 'zod';

/**
 * Structured content for the /picnic page. The layout is fixed; the words,
 * date, time, venue, games and every photograph are editable. Defaults are the
 * page's own copy and photos, so the editor opens pre-filled.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
/** Blank in the editor = not confirmed yet; the page says so. */
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** The picnic day as YYYY-MM-DD (Lagos). Blank until it is fixed. */
const dateOnly = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional().or(z.literal(''));

const ActivitySchema = z.object({ title: text(80), body: text(400) });
/** A game on the day; admins add as many as they like. */
/** A relative path or an absolute URL (Unsplash, R2 uploads); null = the gingham panel. */
const imageUrl = z.string().trim().max(2000).refine((v) => v.startsWith('/') || /^https?:\/\//i.test(v), 'Must be a relative path or absolute URL').nullable().optional();
const GameSchema = z.object({ name: text(80), description: text(400), forWho: optionalText(40), image: imageUrl });

/** One photo spot on the page. A blank picture falls back to the page's own photo. */
const PhotoSchema = z.object({ src: imageUrl, alt: optionalText(200), caption: optionalText(80) });
/** Every photo spot. Optional so content saved before photos were editable still validates. */
const PhotosSchema = z.object({
  hero: PhotoSchema.optional(),
  heroSmall: PhotoSchema.optional(),
  family: PhotoSchema.optional(),
  verse: PhotoSchema.optional(),
  bring1: PhotoSchema.optional(),
  bring2: PhotoSchema.optional(),
  bring3: PhotoSchema.optional(),
});

const unsplash = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PicnicSchema = z.object({
  kicker: text(120),
  headline: text(80),
  headlineMiddle: text(80),
  headlineAccent: text(80),
  intro: text(600),
  date: dateOnly,
  time: optionalText(80),
  venue: optionalText(160),
  afternoonKicker: text(60),
  afternoonTitle: text(120),
  familyNote: text(160),
  afternoon: z.array(ActivitySchema).min(1).max(6),
  verseText: text(400),
  verseRef: text(60),
  gamesKicker: text(60),
  gamesTitle: text(120),
  gamesIntro: text(400),
  games: z.array(GameSchema).max(60),
  bring: z.array(text(120)).min(1).max(8),
  bringClose: text(120),
  rsvpTitle: text(120),
  rsvpBody: text(400),
  /** The words drifting along the strip under the hero. */
  vibes: z.array(text(40)).max(16).optional(),
  photos: PhotosSchema.optional(),
});

export type PicnicContent = z.infer<typeof PicnicSchema>;

export const DEFAULT_PICNIC: PicnicContent = {
  kicker: 'Everlasting Hills Church · End-of-year hangout',
  headline: 'Grab a mat.',
  headlineMiddle: 'Bring friends.',
  headlineAccent: "Let's hang out.",
  intro:
    'One long, easy afternoon to close the year. Music playing, jollof going round, games on the grass and nowhere else to be. Come as you are, stay as long as you like.',
  date: null,
  time: null,
  venue: null,
  afternoonKicker: 'The vibe',
  afternoonTitle: 'Good food, good music, good people.',
  familyNote: 'Aunties, uncles, little ones. Bring them all.',
  afternoon: [
    { title: 'Food going round', body: 'Jollof, small chops, chilled drinks and whatever you bring from your kitchen. Nobody leaves hungry.' },
    { title: 'Music all afternoon', body: 'A playlist that keeps the mood easy, and a few songs everyone knows the words to. Requests welcome.' },
    { title: 'Games on the grass', body: 'Something for the children, and something for the grown-ups who still think they can win a race.' },
    { title: 'The gift exchange', body: 'Signed up for the gift exchange? This is where the gifts change hands.' },
    { title: 'Gist and catch-up', body: 'No programme to rush through. Pull up a chair, laugh, pray, and finally talk to the people you only wave at on Sunday.' },
  ],
  verseText: 'Behold, how good and how pleasant it is for brethren to dwell together in unity!',
  verseRef: 'Psalm 133:1',
  gamesKicker: 'Games',
  gamesTitle: 'Join in, or just cheer.',
  gamesIntro: 'Play, cheer from the mat or keep score. Prizes for the winners, bragging rights for everyone else.',
  games: [
    { name: 'Sack race', description: 'Into the sack and hop for the line. Children first, then the brave grown-ups.', forWho: 'Everyone', image: 'https://images.unsplash.com/photo-1756113438470-2b1f166801b4?auto=format&fit=crop&w=800&q=80' },
    { name: 'Tug of war', description: 'Men against women, or one unit against another. Hold the rope; the grass is soft.', forWho: 'Adults', image: 'https://images.unsplash.com/photo-1748698534410-867798220fa8?auto=format&fit=crop&w=800&q=80' },
    { name: 'Egg-and-spoon race', description: 'Steady hands win. Drop the egg and it\'s back to the start.', forWho: 'Children', image: null },
    { name: 'Musical chairs', description: 'One chair short every round, and the music stops when you least expect it.', forWho: 'Everyone', image: 'https://images.unsplash.com/photo-1603501266047-f4a2f093503b?auto=format&fit=crop&w=800&q=80' },
    { name: 'Ayo and Ludo', description: 'Board games on the mats for anyone who would rather sit and plot.', forWho: 'Everyone', image: 'https://images.unsplash.com/photo-1761716475708-ef98183ccb62?auto=format&fit=crop&w=800&q=80' },
    { name: 'Five-a-side football', description: 'A small pitch, small goals and very big opinions.', forWho: 'Teens and adults', image: 'https://images.unsplash.com/photo-1622659097509-4d56de14539e?auto=format&fit=crop&w=800&q=80' },
    { name: 'Bible quiz', description: 'Teams, a buzzer and questions from Genesis to Revelation.', forWho: 'Everyone', image: null },
    { name: 'Face painting and colouring', description: 'A quiet corner with crayons and colours for the little ones.', forWho: 'Children', image: 'https://images.unsplash.com/photo-1764662367028-9d70a9942d95?auto=format&fit=crop&w=800&q=80' },
  ],
  bring: [
    'A mat, a blanket or a camping chair',
    'Something to share, if you can',
    'A hat and sunglasses (the Ibadan sun is no joke)',
    'Your playlist requests',
    'A friend who needs a church family',
  ],
  bringClose: '…and your best gist.',
  rsvpTitle: 'You coming through?',
  rsvpBody: "Everyone's welcome: friends, family, neighbours. Tell us you're coming so there's enough food to go round.",
  vibes: ['Good music', 'Jollof', 'Suya', 'Small chops', 'Chilled drinks', 'Games on the grass', 'Gist', 'Gift exchange', 'Sunshine', 'The whole family'],
  photos: {
    hero: { src: unsplash('1625283518288-00362afc8663'), alt: 'Four friends lying on a picnic blanket, laughing', caption: 'see you on the grass' },
    heroSmall: { src: unsplash('1785175659769-f5ba232a0a90', 1000), alt: 'Grapes, apples, flowers and a sun hat on a picnic blanket', caption: null },
    family: { src: unsplash('1668965450077-1d23194b5f86'), alt: 'Women and children sitting together on the grass under palm trees', caption: null },
    verse: {
      src: 'https://images.unsplash.com/photo-1652169892293-ba174ef19931?auto=format&fit=crop&w=3840&q=92',
      alt: 'A picnic spread on a cream blanket under a blossoming tree',
      caption: null,
    },
    bring1: { src: unsplash('1729571598934-bfe353b58fea', 1000), alt: 'Friends resting on a blue checked blanket under the trees', caption: 'slow afternoons' },
    bring2: { src: unsplash('1731186622228-38f68d3f64ad', 1000), alt: 'A red gingham picnic blanket with a basket, glasses and snacks', caption: 'the good blanket' },
    bring3: { src: unsplash('1785175659769-f5ba232a0a90', 1000), alt: 'Grapes, apples, flowers and a sun hat on a picnic blanket', caption: 'someone always brings fruit' },
  },
};
