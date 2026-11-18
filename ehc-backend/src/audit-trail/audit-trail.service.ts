import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import { type AuditRow, buildFeed, type FeedItem, MERGE_WINDOW_MS, REQUEST } from './audit-feed';
import type { AuditTrailQuery } from './audit-trail.schema';

const LAGOS_OFFSET = '+01:00';
const dayStart = (day: string) => new Date(`${day}T00:00:00${LAGOS_OFFSET}`);
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function parseCursor(cursor: string | undefined): { at: Date; id: string } | null {
  if (!cursor) return null;
  const [at, id] = cursor.split('|');
  const date = new Date(at);
  if (!id || Number.isNaN(date.getTime())) throw new BadRequestException('That page link is not valid');
  return { at: date, id };
}

/** Reads the audit trail: everything people did, newest first, with filters. Super Admin only (see the controller). */
@Injectable()
export class AuditTrailService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(q: AuditTrailQuery): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
    const conds: Prisma.Sql[] = [Prisma.sql`"tenantId" = ${this.tenantId}`];
    if (q.from) conds.push(Prisma.sql`"createdAt" >= ${dayStart(q.from)}`);
    if (q.to) conds.push(Prisma.sql`"createdAt" < ${new Date(dayStart(q.to).getTime() + 86_400_000)}`);
    if (q.area) conds.push(Prisma.sql`action = ${REQUEST} AND entity = ${q.area}`);
    if (q.actor) conds.push(Prisma.sql`"actorId" = ${q.actor}`);
    const search = q.search?.trim();
    if (search) {
      const like = `%${escapeLike(search)}%`;
      const people = await this.actorsNamed(search);
      const byPerson = people.length ? Prisma.sql` OR "actorId" IN (${Prisma.join(people)})` : Prisma.empty;
      conds.push(Prisma.sql`(after::text ILIKE ${like} OR before::text ILIKE ${like} OR entity ILIKE ${like}${byPerson})`);
    }
    const cursor = parseCursor(q.cursor);
    if (cursor) conds.push(Prisma.sql`("createdAt", id) < (${cursor.at}, ${cursor.id})`);

    const rows = await this.prisma.$queryRaw<AuditRow[]>`
      SELECT id, "actorId", action, entity, "entityId", before, after, "createdAt"
      FROM "AuditLog" WHERE ${Prisma.join(conds, ' AND ')}
      ORDER BY "createdAt" DESC, id DESC LIMIT ${q.take + 1}`;
    const page = rows.slice(0, q.take);
    const last = rows.length > q.take ? page[page.length - 1] : null;

    const items = buildFeed(page, await this.nearby(page), { surface: !!search });
    const names = await this.namesOf(items.map((i) => i.actorId));
    return {
      items: items.map((i) => ({ ...i, actorName: i.actorId ? (names.get(i.actorId) ?? null) : null })),
      nextCursor: last ? `${last.createdAt.toISOString()}|${last.id}` : null,
    };
  }

  /** The areas (dashboard sections) and the people that appear in the trail, for the filters. */
  async filters() {
    const [areas, actors] = await Promise.all([
      this.prisma.$queryRaw<{ entity: string }[]>`
        SELECT DISTINCT entity FROM "AuditLog" WHERE "tenantId" = ${this.tenantId} AND action = ${REQUEST} ORDER BY entity`,
      this.prisma.$queryRaw<{ actorId: string }[]>`
        SELECT DISTINCT "actorId" FROM "AuditLog" WHERE "tenantId" = ${this.tenantId} AND "actorId" IS NOT NULL`,
    ]);
    const names = await this.namesOf(actors.map((a) => a.actorId));
    const people = actors
      .map((a) => ({ userId: a.actorId, name: names.get(a.actorId) ?? 'Someone no longer on the system' }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { areas: areas.map((a) => a.entity), people };
  }

  /** The same people's rows just around this page, so their records fold into the right request. */
  private async nearby(page: AuditRow[]): Promise<AuditRow[]> {
    const actors = [...new Set(page.map((r) => r.actorId).filter((a): a is string => !!a))];
    if (actors.length === 0) return [];
    const times = page.map((r) => r.createdAt.getTime());
    const from = new Date(Math.min(...times) - MERGE_WINDOW_MS);
    const to = new Date(Math.max(...times) + MERGE_WINDOW_MS);
    return this.prisma.$queryRaw<AuditRow[]>`
      SELECT id, "actorId", action, entity, "entityId", before, after, "createdAt"
      FROM "AuditLog"
      WHERE "tenantId" = ${this.tenantId} AND "actorId" IN (${Prisma.join(actors)})
        AND "createdAt" >= ${from} AND "createdAt" <= ${to}
      ORDER BY "createdAt" DESC LIMIT 500`;
  }

  /** People whose name has every word searched for. The trail keeps their sign-in id (Profile.userId). */
  private async actorsNamed(search: string): Promise<string[]> {
    const words = search.split(/\s+/).filter(Boolean).slice(0, 4);
    const found = await this.prisma.profile.findMany({
      where: {
        Member: {
          AND: words.map((w) => ({
            OR: [{ firstName: { contains: w, mode: 'insensitive' as const } }, { lastName: { contains: w, mode: 'insensitive' as const } }],
          })),
        },
      },
      select: { userId: true },
      take: 50,
    });
    return found.map((p) => p.userId);
  }

  private async namesOf(userIds: (string | null)[]): Promise<Map<string, string>> {
    const ids = [...new Set(userIds.filter((id): id is string => !!id))];
    if (ids.length === 0) return new Map();
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, Member: { select: { firstName: true, lastName: true } } },
    });
    return new Map(
      profiles.flatMap((p) => {
        const name = p.Member ? `${p.Member.firstName} ${p.Member.lastName}`.trim() : '';
        return name ? [[p.userId, name] as [string, string]] : [];
      }),
    );
  }
}
