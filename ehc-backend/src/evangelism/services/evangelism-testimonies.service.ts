import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { EvangelismTestimonyDto, UpdateEvangelismTestimonyDto } from '../dto/evangelism.dto';
import type { EvangelismViewer } from '../evangelism.types';
import { EvangelismAccessService } from './evangelism-access.service';

const INCLUDE = {
  Contact: { select: { id: true, name: true } },
  Outreach: { select: { id: true, name: true } },
} satisfies Prisma.EvangelismTestimonyInclude;

type Row = Prisma.EvangelismTestimonyGetPayload<{ include: typeof INCLUDE }>;

/** Testimonies from the field; a leader marks the ones approved to share. */
@Injectable()
export class EvangelismTestimoniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EvangelismAccessService,
  ) {}

  private get tenantId() {
    return this.access.tenant;
  }

  async list() {
    const rows = await this.prisma.evangelismTestimony.findMany({
      where: { tenantId: this.tenantId },
      include: INCLUDE,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((r) => this.toDto(r));
  }

  private toDto(r: Row) {
    return {
      id: r.id,
      title: r.title,
      body: r.body,
      date: r.date.toISOString(),
      photoUrl: r.photoUrl,
      contact: r.Contact,
      outreach: r.Outreach,
      worker: r.workerName ? { id: r.workerMemberId, name: r.workerName } : null,
      approved: r.approved,
      approvedAt: r.approvedAt?.toISOString() ?? null,
      approvedByName: r.approvedByName,
      submittedBy: { id: r.submittedById, name: r.submittedByName },
      createdAt: r.createdAt.toISOString(),
    };
  }

  async create(viewer: EvangelismViewer, dto: EvangelismTestimonyDto) {
    const links = await this.links(dto.contactId, dto.outreachId, dto.workerMemberId);
    const id = randomUUID();
    const now = new Date();
    await this.prisma.evangelismTestimony.create({
      data: {
        id,
        tenantId: this.tenantId,
        title: dto.title,
        body: dto.body,
        date: dto.date ? this.day(dto.date) : now,
        photoUrl: dto.photoUrl ?? null,
        ...links,
        // The worker defaults to whoever is writing it down.
        workerMemberId: links.workerMemberId ?? viewer.memberId,
        workerName: links.workerName ?? viewer.name,
        submittedById: viewer.memberId,
        submittedByName: viewer.name,
        updatedAt: now,
      },
    });
    return this.one(id);
  }

  async update(viewer: EvangelismViewer, id: string, dto: UpdateEvangelismTestimonyDto) {
    const current = await this.prisma.evangelismTestimony.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!current) throw new NotFoundException('Testimony not found');
    const own = !!viewer.memberId && current.submittedById === viewer.memberId;
    if (dto.approved !== undefined && !viewer.canLead) throw new ForbiddenException('Only leaders approve testimonies to share.');
    if (!viewer.canLead && !own) throw new ForbiddenException('You can edit testimonies you recorded.');

    const data: Prisma.EvangelismTestimonyUncheckedUpdateInput = { updatedAt: new Date() };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.date !== undefined) data.date = this.day(dto.date);
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl || null;
    if (dto.contactId !== undefined || dto.outreachId !== undefined || dto.workerMemberId !== undefined) {
      const links = await this.links(
        dto.contactId === undefined ? current.contactId : dto.contactId,
        dto.outreachId === undefined ? current.outreachId : dto.outreachId,
        dto.workerMemberId === undefined ? current.workerMemberId : dto.workerMemberId,
      );
      Object.assign(data, links);
      if (dto.workerMemberId === undefined) {
        data.workerMemberId = current.workerMemberId;
        data.workerName = current.workerName;
      }
    }
    if (dto.approved !== undefined) {
      data.approved = dto.approved;
      data.approvedAt = dto.approved ? new Date() : null;
      data.approvedByName = dto.approved ? viewer.name : null;
    }
    await this.prisma.evangelismTestimony.update({ where: { id }, data });
    return this.one(id);
  }

  async remove(viewer: EvangelismViewer, id: string) {
    const current = await this.prisma.evangelismTestimony.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { submittedById: true },
    });
    if (!current) throw new NotFoundException('Testimony not found');
    if (!viewer.canLead && current.submittedById !== viewer.memberId) {
      throw new ForbiddenException('You can delete testimonies you recorded.');
    }
    await this.prisma.evangelismTestimony.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async one(id: string) {
    const row = await this.prisma.evangelismTestimony.findFirst({ where: { id, tenantId: this.tenantId }, include: INCLUDE });
    if (!row) throw new NotFoundException('Testimony not found');
    return this.toDto(row);
  }

  private async links(contactId?: string | null, outreachId?: string | null, workerMemberId?: string | null) {
    const [contact, outreach, worker] = await Promise.all([
      contactId
        ? this.prisma.evangelismContact.findFirst({ where: { id: contactId, tenantId: this.tenantId }, select: { id: true } })
        : null,
      outreachId
        ? this.prisma.evangelismOutreach.findFirst({ where: { id: outreachId, tenantId: this.tenantId }, select: { id: true } })
        : null,
      workerMemberId
        ? this.prisma.member.findFirst({
            where: { id: workerMemberId, tenantId: this.tenantId },
            select: { id: true, firstName: true, lastName: true },
          })
        : null,
    ]);
    if (contactId && !contact) throw new BadRequestException('That contact no longer exists.');
    if (outreachId && !outreach) throw new BadRequestException('That outreach no longer exists.');
    if (workerMemberId && !worker) throw new BadRequestException('That worker could not be found.');
    return {
      contactId: contact?.id ?? null,
      outreachId: outreach?.id ?? null,
      workerMemberId: worker?.id ?? null,
      workerName: worker ? `${worker.firstName} ${worker.lastName}`.trim() : null,
    };
  }

  private day(input: string): Date {
    const date = new Date(input.length === 10 ? `${input}T12:00:00+01:00` : input);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date.');
    return date;
  }
}
