import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { EvangelismOutreachDto, UpdateEvangelismOutreachDto } from '../dto/evangelism.dto';
import type { EvangelismViewer } from '../evangelism.types';
import { EvangelismAccessService } from './evangelism-access.service';
import { EvangelismContactsService } from './evangelism-contacts.service';

export interface Tally {
  reached: number;
  saved: number;
  students: number;
}

const tally = (rows: { savedStatus: string; isStudent: boolean }[]): Tally => ({
  reached: rows.length,
  saved: rows.filter((r) => r.savedStatus === 'YES').length,
  students: rows.filter((r) => r.isStudent).length,
});

/** Outreaches the team goes out on, and what came of each. */
@Injectable()
export class EvangelismOutreachesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EvangelismAccessService,
    private readonly contacts: EvangelismContactsService,
  ) {}

  private get tenantId() {
    return this.access.tenant;
  }

  /** Every outreach with its totals, newest first — also feeds the comparison chart. */
  async list() {
    const rows = await this.prisma.evangelismOutreach.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { date: 'desc' },
      include: {
        Workers: { select: { memberId: true } },
        Contacts: { select: { savedStatus: true, isStudent: true } },
      },
    });
    const personal = await this.prisma.evangelismContact.findMany({
      where: { tenantId: this.tenantId, outreachId: null },
      select: { savedStatus: true, isStudent: true },
    });
    const names = await this.access.names(rows.flatMap((r) => r.Workers.map((w) => w.memberId)));
    return {
      outreaches: rows.map((r) => ({
        id: r.id,
        name: r.name,
        date: r.date.toISOString(),
        location: r.location,
        description: r.description,
        active: r.active,
        workers: r.Workers.map((w) => ({ id: w.memberId, name: names.get(w.memberId)?.name ?? 'Former member' })),
        ...tally(r.Contacts),
      })),
      personal: tally(personal),
    };
  }

  async get(viewer: EvangelismViewer, id: string) {
    const outreach = await this.prisma.evangelismOutreach.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { Workers: { select: { memberId: true } } },
    });
    if (!outreach) throw new NotFoundException('Outreach not found');

    const { data: contacts } = await this.contacts.list(viewer, { outreachId: id, take: 5000 });
    const names = await this.access.names(outreach.Workers.map((w) => w.memberId));

    const byWorker = new Map<string, { id: string | null; name: string; reached: number; saved: number; students: number }>();
    for (const c of contacts) {
      const key = c.worker.id ?? `name:${c.worker.name.toLowerCase()}`;
      const entry = byWorker.get(key) ?? { id: c.worker.id, name: c.worker.name, reached: 0, saved: 0, students: 0 };
      entry.reached++;
      if (c.savedStatus === 'YES') entry.saved++;
      if (c.isStudent) entry.students++;
      byWorker.set(key, entry);
    }

    return {
      id: outreach.id,
      name: outreach.name,
      date: outreach.date.toISOString(),
      location: outreach.location,
      description: outreach.description,
      active: outreach.active,
      workers: outreach.Workers.map((w) => ({ id: w.memberId, name: names.get(w.memberId)?.name ?? 'Former member' })),
      ...tally(contacts),
      byWorker: [...byWorker.values()].sort((a, b) => b.reached - a.reached || a.name.localeCompare(b.name)),
      contacts,
    };
  }

  async create(viewer: EvangelismViewer, dto: EvangelismOutreachDto) {
    const workerIds = await this.checkWorkers(dto.workerIds ?? []);
    const id = randomUUID();
    const now = new Date();
    await this.prisma.evangelismOutreach.create({
      data: {
        id,
        tenantId: this.tenantId,
        name: dto.name,
        date: this.day(dto.date),
        location: dto.location ?? null,
        description: dto.description ?? null,
        active: dto.active ?? true,
        createdById: viewer.memberId,
        updatedById: viewer.memberId,
        updatedAt: now,
        Workers: { create: workerIds.map((memberId) => ({ id: randomUUID(), memberId })) },
      },
    });
    return { id };
  }

  async update(viewer: EvangelismViewer, id: string, dto: UpdateEvangelismOutreachDto) {
    const current = await this.prisma.evangelismOutreach.findFirst({ where: { id, tenantId: this.tenantId }, select: { id: true } });
    if (!current) throw new NotFoundException('Outreach not found');

    const data: Prisma.EvangelismOutreachUncheckedUpdateInput = { updatedById: viewer.memberId, updatedAt: new Date() };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.date !== undefined) data.date = this.day(dto.date);
    if (dto.location !== undefined) data.location = dto.location || null;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.active !== undefined) data.active = dto.active;

    const ops: Prisma.PrismaPromise<unknown>[] = [this.prisma.evangelismOutreach.update({ where: { id }, data })];
    if (dto.workerIds !== undefined) {
      const workerIds = await this.checkWorkers(dto.workerIds);
      ops.push(
        this.prisma.evangelismOutreachWorker.deleteMany({ where: { outreachId: id, memberId: { notIn: workerIds } } }),
        this.prisma.evangelismOutreachWorker.createMany({
          data: workerIds.map((memberId) => ({ id: randomUUID(), outreachId: id, memberId })),
          skipDuplicates: true,
        }),
      );
    }
    await this.prisma.$transaction(ops);
    return { id };
  }

  /** Its contacts stay, as personal evangelism. */
  async remove(id: string) {
    const current = await this.prisma.evangelismOutreach.findFirst({ where: { id, tenantId: this.tenantId }, select: { id: true } });
    if (!current) throw new NotFoundException('Outreach not found');
    await this.prisma.evangelismOutreach.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** For the public form: outreaches still open for recording. */
  async activeForForm() {
    const rows = await this.prisma.evangelismOutreach.findMany({
      where: { tenantId: this.tenantId, active: true },
      orderBy: { date: 'desc' },
      select: { id: true, name: true, date: true },
      take: 30,
    });
    return rows.map((r) => ({ id: r.id, name: r.name, date: r.date.toISOString() }));
  }

  private day(input: string): Date {
    const date = new Date(input.length === 10 ? `${input}T12:00:00+01:00` : input);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date.');
    return date;
  }

  /** Anyone in the church can be recorded as having gone (a former team member, a helper). */
  private async checkWorkers(ids: string[]): Promise<string[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const known = await this.prisma.member.findMany({
      where: { id: { in: unique }, tenantId: this.tenantId },
      select: { id: true },
    });
    if (known.length !== unique.length) throw new BadRequestException('Some of those people could not be found.');
    return unique;
  }
}
