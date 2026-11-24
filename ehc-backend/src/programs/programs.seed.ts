import { randomUUID } from 'crypto';
import type {
  PrismaClient,
  ProgramAccent,
  ProgramCadence,
  ProgramDateStatus,
  ProgramFormat,
  ProgramNameStatus,
  ProgramScriptureStatus,
  ProgramType,
} from '@prisma/client';

/**
 * The five programs the church started with. Insert-only: a program whose
 * slug already exists for the tenant is left exactly as the pastors edited it.
 * Every field stays editable in the dashboard. Copy marked WRITTEN in the build
 * report was drafted for review, not supplied by the pastors.
 */
type SeedScripture = { bookId: number; chapter: number; verseStart: number; verseEnd?: number; status?: ProgramScriptureStatus };
type SeedProgram = {
  slug: string;
  name: string;
  nameStatus?: ProgramNameStatus;
  programType: ProgramType;
  cadence: ProgramCadence;
  recurrenceRule?: string;
  startTime?: string;
  durationMinutes?: number;
  startOffsetDays?: number;
  dateStatus: ProgramDateStatus;
  format: ProgramFormat;
  streamUrl?: string;
  accent: ProgramAccent;
  ctaLabel?: string;
  ctaUrl?: string;
  featured?: boolean;
  shortDescription: string;
  longDescription: string;
  scriptures: SeedScripture[];
  sessions?: { name: string; startTime: string; endTime: string }[];
  editions?: { label: string; theme?: string; startsOn?: string; endsOn?: string; dateStatus: ProgramDateStatus; summary?: string }[];
};

/** Bible book ids, as seeded by scripts/seed-scripture.ts (Genesis 1 to Revelation 66). */
const GENESIS = 1;
const DEUTERONOMY = 5;
const ISAIAH = 23;
const MALACHI = 39;
const LUKE = 42;

const YOUTUBE = 'https://www.youtube.com/@everlastinghillschurch';

export const PROGRAM_SEED: SeedProgram[] = [
  {
    slug: 'prayer-watch',
    name: 'Prayer Watch',
    programType: 'PRAYER',
    cadence: 'WEEKLY',
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA',
    startTime: '22:00',
    durationMinutes: 480,
    dateStatus: 'CONFIRMED',
    format: 'HYBRID',
    accent: 'BURGUNDY',
    ctaLabel: 'Join a watch',
    ctaUrl: '/prayer-watch',
    featured: true,
    shortDescription:
      'Watchmen on the walls. Every member takes a watch and the house is never silent, night after night, until the Lord establishes His word over us.',
    longDescription:
      '<p>Five nights a week, from 10 PM until 6 AM, the church keeps watch in four shifts so that prayer never stops over the house. Every member of Everlasting Hills takes a watch.</p><p>We do not pray from a fixed script. We pray from the prophetic words the Lord has spoken over EHC, and each watchman draws their own prayer points from those words. Choose the watch that fits your night, keep it faithfully, and hand the wall to the next watch on the hour.</p>',
    scriptures: [{ bookId: ISAIAH, chapter: 62, verseStart: 6, verseEnd: 7 }],
    sessions: [
      { name: 'The Seers', startTime: '22:00', endTime: '00:00' },
      { name: 'The Watch-House', startTime: '00:00', endTime: '02:00' },
      { name: 'The Threshers', startTime: '02:00', endTime: '04:00' },
      { name: 'The Gatekeepers', startTime: '04:00', endTime: '06:00' },
    ],
  },
  {
    slug: 'dew-of-heaven',
    name: 'Dew of Heaven',
    programType: 'PROPHETIC',
    cadence: 'MONTHLY',
    // The last day of the month, crossing over into the new month and running
    // through its second day: from 10 PM on the last day, 48 hours.
    recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=-1',
    startTime: '22:00',
    durationMinutes: 2880,
    dateStatus: 'CONFIRMED',
    format: 'IN_PERSON',
    accent: 'GOLD',
    shortDescription:
      'We cross into every new month under an open heaven, declaring the dew of heaven and the precious things of the deep over our lives, families and the house.',
    longDescription:
      '<p>On the last night of every month we gather to cross over together, and we keep declaring for the first two days of the new month. This is a prophetic meeting. We speak what the Lord has spoken: the dew of heaven, the fatness of the earth, and the precious things of the deep over our lives, our families and this house.</p><p>Come ready to declare, not only to listen. Start every month on purpose, with heaven open over you.</p>',
    scriptures: [
      { bookId: GENESIS, chapter: 27, verseStart: 28 },
      { bookId: DEUTERONOMY, chapter: 33, verseStart: 13 },
      { bookId: DEUTERONOMY, chapter: 33, verseStart: 28 },
    ],
  },
  {
    slug: 'furnace',
    name: 'Furnace',
    programType: 'CONSECRATION',
    cadence: 'ANNUAL',
    dateStatus: 'TBA',
    format: 'HYBRID',
    streamUrl: YOUTUBE,
    accent: 'CRIMSON',
    shortDescription:
      "Thirty days in the refiner's fire. We set ourselves apart, fasting and praying, until we come out purified and ready to offer the Lord an offering in righteousness.",
    longDescription:
      '<p>Every October the whole church enters the Furnace: a month set apart for fasting and prayer. Each edition carries its own word from the Lord, and the meetings are streamed so that no one is left outside the fire.</p><p>The Furnace is not punishment. It is the refiner at work, burning away what does not belong so that what remains can be offered to the Lord in righteousness. Plan your October around it, and come out changed.</p>',
    scriptures: [{ bookId: MALACHI, chapter: 3, verseStart: 1, verseEnd: 3 }],
    editions: [
      { label: "Furnace '26", theme: 'Dominion', startsOn: '2026-10-02', endsOn: '2026-10-31', dateStatus: 'CONFIRMED' },
      { label: "Furnace '27", dateStatus: 'TBA' },
    ],
  },
  {
    slug: 'homecoming-conference',
    name: 'Homecoming Conference',
    nameStatus: 'PROVISIONAL',
    programType: 'CONFERENCE',
    cadence: 'ANNUAL',
    // Planned for the last weekend of April: the last Saturday, starting the Friday before.
    recurrenceRule: 'FREQ=YEARLY;BYMONTH=4;BYDAY=-1SA',
    startTime: '10:00',
    durationMinutes: 4320,
    startOffsetDays: -1,
    dateStatus: 'TBA',
    format: 'IN_PERSON',
    accent: 'DEEP_BURGUNDY',
    shortDescription:
      'Our biggest gathering of the year. Believers come home from across Nigeria and beyond for worship, sound teaching, the move of the Holy Ghost and fellowship.',
    longDescription:
      '<p>Once a year the family comes home. Sons and daughters of this house, and friends from across Nigeria and beyond, gather for three days of worship, sound teaching and the move of the Holy Ghost.</p><p>Homecoming is where testimonies are shared, where friendships are renewed and where the word for the season is released over the house. Keep the last weekend of April free, and bring someone home with you.</p>',
    scriptures: [],
  },
  {
    slug: 'endyo',
    name: 'Endyo',
    programType: 'HOLY_GHOST',
    cadence: 'CUSTOM',
    dateStatus: 'TBA',
    format: 'IN_PERSON',
    accent: 'BURGUNDY',
    shortDescription: 'The Word is opened, prayer goes up, and the Holy Ghost has free course through us and in us.',
    longDescription:
      '<p>Endyo is the Greek word behind "endued" in the promise of Luke 24:49: clothed with power from on high. In these meetings the Word is opened, prayer goes up, and we make room for the Holy Ghost to move freely among us.</p><p>Come expecting to be filled, refreshed and sent out. We do not leave the way we came.</p>',
    scriptures: [{ bookId: LUKE, chapter: 24, verseStart: 49, status: 'SUGGESTED' }],
  },
];

/** Inserts any seed program the tenant does not have yet. Returns the slugs it added. */
export async function seedPrograms(prisma: PrismaClient, tenantId: string): Promise<string[]> {
  const added: string[] = [];
  for (const [index, p] of PROGRAM_SEED.entries()) {
    const exists = await prisma.program.findUnique({ where: { tenantId_slug: { tenantId, slug: p.slug } }, select: { id: true } });
    if (exists) continue;
    const id = randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.program.create({
        data: {
          id,
          tenantId,
          slug: p.slug,
          name: p.name,
          nameStatus: p.nameStatus ?? 'FINAL',
          shortDescription: p.shortDescription,
          longDescription: p.longDescription,
          programType: p.programType,
          cadence: p.cadence,
          recurrenceRule: p.recurrenceRule ?? null,
          startTime: p.startTime ?? null,
          durationMinutes: p.durationMinutes ?? null,
          startOffsetDays: p.startOffsetDays ?? 0,
          dateStatus: p.dateStatus,
          format: p.format,
          streamUrl: p.streamUrl ?? null,
          accent: p.accent,
          ctaLabel: p.ctaLabel ?? null,
          ctaUrl: p.ctaUrl ?? null,
          featured: p.featured ?? false,
          status: 'PUBLISHED',
          sortOrder: index + 1,
        },
      });
      for (const [i, s] of p.scriptures.entries())
        await tx.programScripture.create({
          data: { id: randomUUID(), programId: id, bookId: s.bookId, chapter: s.chapter, verseStart: s.verseStart, verseEnd: s.verseEnd ?? null, scriptureStatus: s.status ?? 'CONFIRMED', sortOrder: i },
        });
      for (const [i, s] of (p.sessions ?? []).entries())
        await tx.programSession.create({ data: { id: randomUUID(), programId: id, name: s.name, startTime: s.startTime, endTime: s.endTime, sortOrder: i } });
      for (const e of p.editions ?? [])
        await tx.programEdition.create({
          data: {
            id: randomUUID(),
            programId: id,
            label: e.label,
            theme: e.theme ?? null,
            startsOn: e.startsOn ? new Date(`${e.startsOn}T00:00:00Z`) : null,
            endsOn: e.endsOn ? new Date(`${e.endsOn}T00:00:00Z`) : null,
            dateStatus: e.dateStatus,
            summary: e.summary ?? null,
          },
        });
    });
    added.push(p.slug);
  }
  return added;
}
