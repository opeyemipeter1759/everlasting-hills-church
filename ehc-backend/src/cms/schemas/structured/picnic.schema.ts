import { z } from 'zod';

/**
 * Structured content for the /picnic page. The design and photographs are
 * fixed; the words, the time and the venue are editable. Defaults are the
 * page's original copy, so the editor opens pre-filled.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
/** Blank in the editor = not confirmed yet; the page says so. */
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** The picnic day as YYYY-MM-DD (Lagos). Blank until it is fixed. */
const dateOnly = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional().or(z.literal(''));

const ActivitySchema = z.object({ title: text(80), body: text(400) });
/** A game on the day; admins add as many as they like. */
const GameSchema = z.object({ name: text(80), description: text(400), forWho: optionalText(40) });

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
});

export type PicnicContent = z.infer<typeof PicnicSchema>;

export const DEFAULT_PICNIC: PicnicContent = {
  kicker: 'Everlasting Hills Church · End-of-year picnic',
  headline: 'Pack a blanket.',
  headlineMiddle: "We're having",
  headlineAccent: 'a picnic.',
  intro:
    'One unhurried Sunday afternoon to close the year — good food, open grass, games for the children, and the whole church family in one place.',
  date: null,
  time: null,
  venue: null,
  afternoonKicker: 'The afternoon',
  afternoonTitle: 'Nothing fancy. Just us, outside.',
  familyNote: "Aunties, uncles, little ones — everybody's invited.",
  afternoon: [
    { title: 'Food to share', body: "Coolers, plates, something from your kitchen if you'd like to bring it. Nobody goes home hungry." },
    { title: 'Games on the grass', body: 'Something for the children, and something for the ones who still think they can win a race.' },
    { title: 'The gift exchange', body: 'Signed up for the gift exchange? This is where the gifts change hands.' },
    {
      title: 'Time with each other',
      body: 'No programme to rush through. Sit, talk, laugh, pray — and meet the people you only ever wave at on Sunday.',
    },
  ],
  verseText: 'Behold, how good and how pleasant it is for brethren to dwell together in unity!',
  verseRef: 'Psalm 133:1',
  gamesKicker: 'Games',
  gamesTitle: 'Something for every age.',
  gamesIntro: 'Join in, cheer from the blanket, or keep score. Prizes for the winners, bragging rights for everyone else.',
  games: [
    { name: 'Sack race', description: 'Into the sack and hop for the line. Children first, then the brave grown-ups.', forWho: 'Everyone' },
    { name: 'Tug of war', description: 'Men against women, or one unit against another. Hold the rope; the grass is soft.', forWho: 'Adults' },
    { name: 'Egg-and-spoon race', description: 'Steady hands win. Drop the egg and it\'s back to the start.', forWho: 'Children' },
    { name: 'Musical chairs', description: 'One chair short every round, and the music stops when you least expect it.', forWho: 'Everyone' },
    { name: 'Ayo and Ludo', description: 'Board games on the mats for anyone who would rather sit and plot.', forWho: 'Everyone' },
    { name: 'Five-a-side football', description: 'A small pitch, small goals and very big opinions.', forWho: 'Teens and adults' },
    { name: 'Bible quiz', description: 'Teams, a buzzer and questions from Genesis to Revelation.', forWho: 'Everyone' },
    { name: 'Face painting and colouring', description: 'A quiet corner with crayons and colours for the little ones.', forWho: 'Children' },
  ],
  bring: ['A blanket or a mat', 'Something to share (if you can)', 'A hat — the Ibadan sun is no joke', 'Someone who needs a church family'],
  bringClose: '…and your appetite.',
  rsvpTitle: 'Will we see you there?',
  rsvpBody: 'Everyone is welcome — friends, family, neighbours. Leave your details so we plan enough of everything for everyone.',
};
