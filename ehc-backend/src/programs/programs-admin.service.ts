import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import sanitizeHtml = require('sanitize-html');
import type { AuthUser } from '../auth/types/auth-user';
import { CmsRevalidateService } from '../cms/services/cms-revalidate.service';
import type { Env } from '../config/env.validation';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import { describeSchedule, eyebrowFor, occurrencesFor, type ScheduleInput } from './program-occurrences';
import { formatReference, parseReference, resolveScriptures } from './program-scripture';
import { scheduleOf, type ProgramWithParts } from './program-view';
import {
  createProgramSchema,
  editionsSchema,
  reorderSchema,
  schedulePreviewSchema,
  scripturesSchema,
  sessionsSchema,
  updateProgramSchema,
} from './programs.schemas';

const PARTS = {
  Scriptures: { orderBy: { sortOrder: 'asc' as const } },
  Sessions: { orderBy: { sortOrder: 'asc' as const } },
  Editions: { orderBy: { startsOn: 'asc' as const } },
};

/** The pastors' formatting, nothing executable. Applied before saving. */
export function sanitizeDescription(html: string | null): string | null {
  if (!html) return null;
  const clean = sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    disallowedTagsMode: 'discard',
  }).trim();
  return clean || null;
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'program';

/**
 * The dashboard's Programs manager. Every route is behind @Roles(Role.ADMIN),
 * which the role hierarchy opens to Admin, Admin Head, Pastor and Super Admin.
 * Every write refreshes the public pages (tag programs:<tenantId>), and
 * publishing, archiving and deleting leave an audit row.
 */
@Injectable()
export class ProgramsAdminService {
  readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: CmsRevalidateService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list() {
    const rows = (await this.prisma.program.findMany({ where: { tenantId: this.tenantId }, include: PARTS, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })) as ProgramWithParts[];
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      status: r.status,
      featured: r.featured,
      sortOrder: r.sortOrder,
      cadence: r.cadence,
      programType: r.programType,
      accent: r.accent,
      logoUrl: r.logoUrl,
      shortDescription: r.shortDescription,
      eyebrow: r.eyebrow?.trim() || eyebrowFor(scheduleOf(r)),
      schedule: describeSchedule(scheduleOf(r)),
      attention: this.attention(r),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async get(id: string) {
    const row = await this.find(id);
    const resolved = await resolveScriptures(this.prisma, row.Scriptures);
    const input = scheduleOf(row);
    const { current, upcoming } = occurrencesFor(input, new Date());
    return {
      ...this.plain(row),
      scriptures: row.Scriptures.map((s, i) => ({ reference: resolved[i].reference, status: s.scriptureStatus, text: resolved[i].text, translation: resolved[i].translation })),
      sessions: row.Sessions.map((s) => ({ name: s.name, startTime: s.startTime, endTime: s.endTime, description: s.description })),
      editions: row.Editions.map((e) => ({ label: e.label, theme: e.theme, startsOn: e.startsOn?.toISOString().slice(0, 10) ?? null, endsOn: e.endsOn?.toISOString().slice(0, 10) ?? null, dateStatus: e.dateStatus, summary: e.summary, recordingUrl: e.recordingUrl })),
      schedule: describeSchedule(input),
      generatedEyebrow: eyebrowFor(input),
      next: [...(current ? [current] : []), ...upcoming].slice(0, 3).map((o) => ({ start: o.start.toISOString(), end: o.end.toISOString(), label: o.label })),
      attention: this.attention(row),
    };
  }

  async create(actor: AuthUser, raw: unknown) {
    const body = parseSchema(createProgramSchema, raw);
    const slug = body.slug ?? (await this.freeSlug(slugify(body.name)));
    const last = await this.prisma.program.aggregate({ where: { tenantId: this.tenantId }, _max: { sortOrder: true } });
    const id = randomUUID();
    try {
      await this.prisma.program.create({
        data: { ...body, id, tenantId: this.tenantId, slug, longDescription: sanitizeDescription(body.longDescription), status: 'DRAFT', sortOrder: (last._max.sortOrder ?? 0) + 1, createdById: actor.profileId ?? null, updatedById: actor.profileId ?? null },
      });
    } catch (err) {
      throw this.duplicate(err);
    }
    this.changed();
    return this.get(id);
  }

  /** Changes only the fields sent. A field left out keeps its value. */
  async update(actor: AuthUser, id: string, raw: unknown) {
    await this.find(id);
    const body = parseSchema(updateProgramSchema, raw);
    const data: Prisma.ProgramUpdateInput = { ...body, updatedById: actor.profileId ?? null };
    if ('longDescription' in body) data.longDescription = sanitizeDescription(body.longDescription ?? null);
    try {
      await this.prisma.program.update({ where: { id }, data });
    } catch (err) {
      throw this.duplicate(err);
    }
    this.changed();
    return this.get(id);
  }

  publish(actor: AuthUser, id: string) {
    return this.setStatus(actor, id, 'PUBLISHED', 'PUBLISH');
  }

  unpublish(actor: AuthUser, id: string) {
    return this.setStatus(actor, id, 'DRAFT', 'UNPUBLISH');
  }

  archive(actor: AuthUser, id: string) {
    return this.setStatus(actor, id, 'ARCHIVED', 'ARCHIVE');
  }

  async remove(actor: AuthUser, id: string) {
    const row = await this.find(id);
    if (row.status === 'PUBLISHED') throw new ConflictException('Archive or unpublish this program before deleting it.');
    await this.prisma.$transaction([this.prisma.program.delete({ where: { id } }), this.audit(actor, 'DELETE', id, { slug: row.slug })]);
    this.changed();
    return { deleted: true };
  }

  /** Saves the order shown in the dashboard: ids first to last. Every id must be one of this church's programs. */
  async reorder(raw: unknown) {
    const { ids } = parseSchema(reorderSchema, raw);
    const owned = await this.prisma.program.findMany({ where: { tenantId: this.tenantId, id: { in: ids } }, select: { id: true } });
    if (owned.length !== new Set(ids).size) throw new NotFoundException('One of those programs does not exist');
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.program.update({ where: { id }, data: { sortOrder: i + 1 } })));
    this.changed();
    return this.list();
  }

  async replaceScriptures(actor: AuthUser, id: string, raw: unknown) {
    await this.find(id);
    const { scriptures } = parseSchema(scripturesSchema, raw);
    const books = await this.prisma.bibleBook.findMany({ select: { id: true, name: true, shortName: true, osisCode: true } });
    const parsed = scriptures.map((s) => {
      const ref = parseReference(s.reference, books);
      if (!ref) throw new BadRequestException(`"${s.reference}" is not a Bible reference we can find`);
      return { ...ref, status: s.status };
    });
    await this.prisma.$transaction([
      this.prisma.programScripture.deleteMany({ where: { programId: id } }),
      ...parsed.map((r, i) =>
        this.prisma.programScripture.create({ data: { id: randomUUID(), programId: id, bookId: r.bookId, chapter: r.chapter, verseStart: r.verseStart, chapterEnd: r.chapterEnd, verseEnd: r.verseEnd, scriptureStatus: r.status, sortOrder: i } }),
      ),
      this.prisma.program.update({ where: { id }, data: { updatedById: actor.profileId ?? null } }),
    ]);
    this.changed();
    return this.get(id);
  }

  async replaceSessions(actor: AuthUser, id: string, raw: unknown) {
    await this.find(id);
    const { sessions } = parseSchema(sessionsSchema, raw);
    await this.prisma.$transaction([
      this.prisma.programSession.deleteMany({ where: { programId: id } }),
      ...sessions.map((s, i) => this.prisma.programSession.create({ data: { id: randomUUID(), programId: id, name: s.name, startTime: s.startTime, endTime: s.endTime, description: s.description, sortOrder: i } })),
      this.prisma.program.update({ where: { id }, data: { updatedById: actor.profileId ?? null } }),
    ]);
    this.changed();
    return this.get(id);
  }

  async replaceEditions(actor: AuthUser, id: string, raw: unknown) {
    await this.find(id);
    const { editions } = parseSchema(editionsSchema, raw);
    const date = (d: string | null) => (d ? new Date(`${d}T00:00:00Z`) : null);
    await this.prisma.$transaction([
      this.prisma.programEdition.deleteMany({ where: { programId: id } }),
      ...editions.map((e) =>
        this.prisma.programEdition.create({ data: { id: randomUUID(), programId: id, label: e.label, theme: e.theme, startsOn: date(e.startsOn), endsOn: date(e.endsOn), dateStatus: e.dateStatus, summary: e.summary, recordingUrl: e.recordingUrl } }),
      ),
      this.prisma.program.update({ where: { id }, data: { updatedById: actor.profileId ?? null } }),
    ]);
    this.changed();
    return this.get(id);
  }

  /** What a schedule being edited means: in words, the line above the name, and the next three dates. */
  schedulePreview(raw: unknown) {
    const body = parseSchema(schedulePreviewSchema, raw);
    const input: ScheduleInput = { ...body, editions: [], sessions: [] };
    const { current, upcoming } = occurrencesFor(input, new Date());
    return {
      schedule: describeSchedule(input),
      eyebrow: eyebrowFor(input),
      next: [...(current ? [current] : []), ...upcoming].slice(0, 3).map((o) => ({ start: o.start.toISOString(), end: o.end.toISOString() })),
    };
  }

  /** For the scripture picker: every book, and a check of one reference with its text. */
  books() {
    return this.prisma.bibleBook.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true, chapterCount: true } });
  }

  async checkReference(reference: string) {
    const books = await this.prisma.bibleBook.findMany({ select: { id: true, name: true, shortName: true, osisCode: true } });
    const ref = parseReference(reference ?? '', books);
    if (!ref) throw new BadRequestException(`"${reference}" is not a Bible reference we can find`);
    const [resolved] = await resolveScriptures(this.prisma, [ref]);
    if (!resolved.text) throw new BadRequestException(`${formatReference(ref, books.find((b) => b.id === ref.bookId)!.name)} has no verses in our Bible`);
    return resolved;
  }

  // ---- helpers ----

  private attention(r: ProgramWithParts): string[] {
    const flags: string[] = [];
    if (r.dateStatus === 'TBA' && !r.Editions.some((e) => e.dateStatus === 'CONFIRMED' && e.endsOn && e.endsOn.getTime() >= Date.now())) flags.push('Date to be announced');
    if (r.nameStatus === 'PROVISIONAL') flags.push('Name not final');
    if (r.Scriptures.some((s) => s.scriptureStatus === 'SUGGESTED')) flags.push('Scripture needs confirmation');
    return flags;
  }

  private plain(r: ProgramWithParts) {
    const { Scriptures, Sessions, Editions, Tenant, Gathering, ...rest } = r as ProgramWithParts & { Tenant?: unknown; Gathering?: unknown };
    void Scriptures;
    void Sessions;
    void Editions;
    void Tenant;
    void Gathering;
    return { ...rest, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  }

  private async setStatus(actor: AuthUser, id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED', action: string) {
    const row = await this.find(id);
    if (row.status === status) return this.get(id);
    await this.prisma.$transaction([
      this.prisma.program.update({ where: { id }, data: { status, updatedById: actor.profileId ?? null } }),
      this.audit(actor, action, id, { slug: row.slug, from: row.status, to: status }),
    ]);
    this.changed();
    return this.get(id);
  }

  private audit(actor: AuthUser, action: string, id: string, after: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({ data: { id: randomUUID(), tenantId: this.tenantId, actorId: actor.userId ?? null, action, entity: 'Program', entityId: id, after } });
  }

  private async find(id: string): Promise<ProgramWithParts> {
    const row = (await this.prisma.program.findFirst({ where: { id, tenantId: this.tenantId }, include: PARTS })) as ProgramWithParts | null;
    if (!row) throw new NotFoundException('No such program');
    return row;
  }

  private async freeSlug(base: string): Promise<string> {
    for (let n = 1; n < 50; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      if (!(await this.prisma.program.findUnique({ where: { tenantId_slug: { tenantId: this.tenantId, slug } }, select: { id: true } }))) return slug;
    }
    return `${base}-${randomUUID().slice(0, 6)}`;
  }

  private duplicate(err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return new ConflictException('Another program already uses that web address (slug).');
    return err;
  }

  private changed() {
    // The site tags its Programs fetches 'programs' (it does not know the tenant id); the tenant tag is for a future multi-church site.
    this.revalidate.trigger(['programs', `programs:${this.tenantId}`], ['/programs']);
  }
}
