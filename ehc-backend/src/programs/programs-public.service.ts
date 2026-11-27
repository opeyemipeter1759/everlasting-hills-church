import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';
import { IcsBuilderService } from '../calendar/services/ics-builder.service';
import { localCalendarDate } from '../calendar/services/recurrence.util';
import { PrismaService } from '../prisma/prisma.service';
import { occurrencesFor } from './program-occurrences';
import { resolveScriptures } from './program-scripture';
import { cardView, detailView, scheduleOf, type ProgramWithParts } from './program-view';

const PARTS = {
  Scriptures: { orderBy: { sortOrder: 'asc' as const } },
  Sessions: { orderBy: { sortOrder: 'asc' as const } },
  Editions: true,
};

/**
 * Published programs for the public site: the church resolved the same way
 * as the rest of the public API (DEFAULT_TENANT_ID). Drafts, archived
 * programs and other churches' programs are never returned.
 */
@Injectable()
export class ProgramsPublicService {
  readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ics: IcsBuilderService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(now = new Date()) {
    const rows = (await this.prisma.program.findMany({
      where: { tenantId: this.tenantId, status: 'PUBLISHED' },
      include: PARTS,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })) as ProgramWithParts[];
    const scriptures = await resolveScriptures(this.prisma, rows.flatMap((r) => r.Scriptures));
    let i = 0;
    return rows.map((r) => cardView(r, r.Scriptures.map(() => scriptures[i++]), now));
  }

  /**
   * Genesis 49:26, the quiet anchor of the Programs page, in the KJV: its "unto the
   * utmost bound of the everlasting hills" is where the church's name comes from
   * (the default WEB reads "ancient hills"). Falls back to the default translation.
   */
  async anchor() {
    const [resolved] = await resolveScriptures(this.prisma, [{ bookId: 1, chapter: 49, verseStart: 26, chapterEnd: null, verseEnd: null }], 'KJV');
    return { ...resolved, status: 'CONFIRMED' as const };
  }

  async detail(slug: string, now = new Date()) {
    const row = await this.published(slug);
    const scriptures = await resolveScriptures(this.prisma, row.Scriptures);
    return detailView(row, scriptures, now, localCalendarDate(now, row.timezone));
  }

  /** An .ics for confirmed dates only: the rule itself when it maps one to one, else each dated occurrence. */
  async calendar(slug: string, now = new Date()): Promise<{ filename: string; body: string }> {
    const row = await this.published(slug);
    const input = scheduleOf(row);
    const { current, upcoming } = occurrencesFor(input, now, 12);
    const dated = [...(current ? [current] : []), ...upcoming];
    if (!dated.length) throw new NotFoundException('The dates for this program are still to be announced.');
    const cal = this.ics.createCalendar({ name: row.name, description: row.shortDescription });
    const url = `https://www.everlastinghills.church/programs/${row.slug}`;
    const repeatsAsRule = !row.Editions.length && row.recurrenceRule && row.startOffsetDays === 0;
    if (repeatsAsRule) {
      this.ics.addEvent(cal, { uid: `program-${row.id}@everlastinghills.church`, summary: row.name, description: row.shortDescription, start: dated[0].start, end: dated[0].end, url, repeating: row.recurrenceRule!, location: row.venue ?? undefined });
    } else {
      for (const o of dated)
        this.ics.addEvent(cal, { uid: `program-${row.id}-${o.start.getTime()}@everlastinghills.church`, summary: o.label ? `${row.name}: ${o.label}` : row.name, description: row.shortDescription, start: o.start, end: o.end, url, location: row.venue ?? undefined });
    }
    return { filename: `${row.slug}.ics`, body: this.ics.toString(cal) };
  }

  private async published(slug: string): Promise<ProgramWithParts> {
    const row = (await this.prisma.program.findFirst({
      where: { tenantId: this.tenantId, slug, status: 'PUBLISHED' },
      include: PARTS,
    })) as ProgramWithParts | null;
    if (!row) throw new NotFoundException('No such program');
    return row;
  }
}
