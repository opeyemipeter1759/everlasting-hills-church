/**
 * Member badges.
 *
 * Every badge is earned from what a member has actually done, so nothing is
 * stored: the badges are worked out from the activity each time, and the day a
 * badge was earned is the day of the activity that crossed its threshold (the
 * tenth service, the first person saved). A track has rising tiers, and its
 * names come from Scripture where one fits.
 */

export type BadgeTrackKey =
  | 'attendance'
  | 'bibleDays'
  | 'plansFinished'
  | 'reached'
  | 'saved'
  | 'salvation'
  | 'books'
  | 'birthdays'
  | 'likes'
  | 'comments'
  | 'articles'
  | 'courses';

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
const LEVELS: BadgeLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

interface Track {
  key: BadgeTrackKey;
  /** What is being counted, for "12 services attended". */
  unit: [singular: string, plural: string];
  tiers: { at: number; name: string }[];
}

export const BADGE_TRACKS: Track[] = [
  {
    key: 'attendance',
    unit: ['service attended', 'services attended'],
    tiers: [
      { at: 1, name: 'First Steps In' },
      { at: 10, name: 'Faithful Worshipper' },
      { at: 25, name: 'Planted in the House' },
      { at: 50, name: 'Pillar of the House' },
      { at: 100, name: 'Doorkeeper of the House' },
    ],
  },
  {
    key: 'bibleDays',
    unit: ['day in the Word', 'days in the Word'],
    tiers: [
      { at: 1, name: 'Opened the Word' },
      { at: 7, name: 'Seven Days in the Word' },
      { at: 30, name: 'Lamp to My Feet' },
      { at: 100, name: 'Hidden in My Heart' },
      { at: 365, name: 'Delight in the Law' },
    ],
  },
  {
    key: 'plansFinished',
    unit: ['Bible plan finished', 'Bible plans finished'],
    tiers: [
      { at: 1, name: 'Finisher' },
      { at: 3, name: 'Running the Race' },
      { at: 5, name: 'Workman Approved' },
      { at: 10, name: 'Berean' },
    ],
  },
  {
    key: 'reached',
    unit: ['person reached with the Gospel', 'people reached with the Gospel'],
    tiers: [
      { at: 1, name: 'Sower' },
      { at: 10, name: 'Fisher of Men' },
      { at: 25, name: 'Harvest Worker' },
      { at: 50, name: 'Evangelist' },
    ],
  },
  {
    key: 'saved',
    unit: ['soul won to Christ', 'souls won to Christ'],
    tiers: [
      { at: 1, name: 'First Fruit' },
      { at: 5, name: 'Soul Winner' },
      { at: 10, name: 'Wise Who Win Souls' },
      { at: 25, name: 'Joy in Heaven' },
    ],
  },
  {
    key: 'salvation',
    unit: ['decision for Christ', 'decisions for Christ'],
    tiers: [{ at: 1, name: 'New Creation' }],
  },
  {
    key: 'books',
    unit: ['book read', 'books read'],
    tiers: [
      { at: 1, name: 'Reader' },
      { at: 3, name: 'Diligent Reader' },
      { at: 5, name: 'Lover of Wisdom' },
      { at: 10, name: 'Scholar' },
    ],
  },
  {
    key: 'birthdays',
    unit: ['birthday wish sent', 'birthday wishes sent'],
    tiers: [
      { at: 1, name: 'Kind Word' },
      { at: 10, name: 'Encourager' },
      { at: 25, name: 'Barnabas' },
      { at: 50, name: 'Cheerful Heart' },
    ],
  },
  {
    key: 'likes',
    unit: ['profile liked', 'profiles liked'],
    tiers: [
      { at: 1, name: 'Friendly' },
      { at: 10, name: 'Brotherly Love' },
      { at: 25, name: 'Knit Together' },
    ],
  },
  {
    key: 'comments',
    unit: ['comment shared', 'comments shared'],
    tiers: [
      { at: 1, name: 'Voice in the Body' },
      { at: 10, name: 'Edifier' },
      { at: 25, name: 'Iron Sharpens Iron' },
      { at: 50, name: 'Exhorter' },
    ],
  },
  {
    key: 'articles',
    unit: ['article published', 'articles published'],
    tiers: [
      { at: 1, name: 'Scribe' },
      { at: 3, name: 'Ready Writer' },
      { at: 5, name: 'Teacher of the Word' },
      { at: 10, name: 'Epistle Writer' },
    ],
  },
  {
    key: 'courses',
    unit: ['course completed', 'courses completed'],
    tiers: [
      { at: 1, name: 'Disciple' },
      { at: 3, name: 'Grounded' },
      { at: 5, name: 'Rooted and Built Up' },
    ],
  },
];

export interface Badge {
  /** "attendance-10" */
  id: string;
  track: BadgeTrackKey;
  name: string;
  /** "10 services attended" */
  description: string;
  level: BadgeLevel;
  earnedAt: Date;
}

export interface BadgeProgress {
  track: BadgeTrackKey;
  count: number;
  /** The next badge on this track, or null when all are earned. */
  next: { name: string; at: number; description: string } | null;
}

const describe = (track: Track, n: number) => `${n} ${n === 1 ? track.unit[0] : track.unit[1]}`;

/**
 * Badges earned from the dates of each kind of activity. Dates need not be
 * sorted; the Nth earliest is the day the Nth-tier badge was earned.
 */
export function earnedBadges(activity: Partial<Record<BadgeTrackKey, Date[]>>): {
  badges: Badge[];
  progress: BadgeProgress[];
} {
  const badges: Badge[] = [];
  const progress: BadgeProgress[] = [];
  for (const track of BADGE_TRACKS) {
    const dates = [...(activity[track.key] ?? [])].sort((a, b) => a.getTime() - b.getTime());
    track.tiers.forEach((tier, i) => {
      if (dates.length >= tier.at) {
        badges.push({
          id: `${track.key}-${tier.at}`,
          track: track.key,
          name: tier.name,
          description: describe(track, tier.at),
          level: LEVELS[Math.min(i, LEVELS.length - 1)],
          earnedAt: dates[tier.at - 1],
        });
      }
    });
    const next = track.tiers.find((tier) => dates.length < tier.at);
    progress.push({
      track: track.key,
      count: dates.length,
      next: next ? { name: next.name, at: next.at, description: describe(track, next.at) } : null,
    });
  }
  // Newest first: what a member earned last is what they want to see.
  badges.sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  return { badges, progress };
}
