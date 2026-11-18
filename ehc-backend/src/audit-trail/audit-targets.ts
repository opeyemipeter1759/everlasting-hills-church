import type { PrismaService } from '../prisma/prisma.service';

/** Who or what a request was about, named at the time, so the name survives a delete. */
export interface AuditTarget {
  kind: string;
  name: string;
}

type Lookup = (db: PrismaService, id: string) => Promise<string | null>;

const fullName = (p: { firstName: string; lastName: string } | null | undefined) =>
  p ? `${p.firstName} ${p.lastName}`.trim() || null : null;

const person: Lookup = async (db, id) =>
  fullName(await db.member.findUnique({ where: { id }, select: { firstName: true, lastName: true } }));
const profile: Lookup = async (db, id) =>
  fullName((await db.profile.findUnique({ where: { id }, select: { Member: { select: { firstName: true, lastName: true } } } }))?.Member);
const visitor: Lookup = async (db, id) =>
  fullName(await db.visitor.findUnique({ where: { id }, select: { firstName: true, lastName: true } }));
const unit: Lookup = async (db, id) => (await db.unit.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
const department: Lookup = async (db, id) =>
  (await db.department.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
const sermon: Lookup = async (db, id) => (await db.sermon.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
const book: Lookup = async (db, id) => (await db.book.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
const announcement: Lookup = async (db, id) =>
  (await db.announcement.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
const event: Lookup = async (db, id) => (await db.event.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
const homeCell: Lookup = async (db, id) => (await db.homeCell.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
const gathering: Lookup = async (db, id) =>
  (await db.recurringGathering.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;

/** Route params that always name the same kind of thing. */
const BY_PARAM: Record<string, [string, Lookup]> = {
  unitId: ['Unit', unit],
  profileId: ['Person', profile],
  memberId: ['Person', person],
  visitorId: ['First-timer', visitor],
};

/** What `:id` means, by the area (the controller's tag). */
const BY_AREA: Record<string, [string, Lookup]> = {
  members: ['Person', person],
  visitors: ['First-timer', visitor],
  'first-timer-team': ['First-timer', visitor],
  departments: ['Department', department],
  sermons: ['Sermon', sermon],
  books: ['Book', book],
  announcements: ['Announcement', announcement],
  events: ['Event', event],
  'home-cell': ['Home cell', homeCell],
  gatherings: ['Gathering', gathering],
};

const UUIDISH = /^[0-9a-zA-Z_-]{6,64}$/;

/** Names every person, unit or record the route points at. A failed lookup just leaves it out. */
export async function resolveTargets(db: PrismaService, area: string, params: Record<string, string>): Promise<AuditTarget[]> {
  const wanted: [string, Lookup, string][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (!value || !UUIDISH.test(value)) continue;
    const hit = key === 'id' ? BY_AREA[area] : BY_PARAM[key];
    if (hit) wanted.push([hit[0], hit[1], value]);
  }
  const names = await Promise.all(wanted.map(([, lookup, id]) => lookup(db, id).catch(() => null)));
  return wanted.flatMap(([kind], i) => (names[i] ? [{ kind, name: names[i] }] : []));
}

/** The id the row is filed under: the route's own id first, then the person or unit it names. */
export function primaryId(params: Record<string, string>): string | null {
  return params.id ?? params.visitorId ?? params.profileId ?? params.memberId ?? params.unitId ?? Object.values(params)[0] ?? null;
}
