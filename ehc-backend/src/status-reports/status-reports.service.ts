import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import type { CreateReportDto, UpdateReportDto } from './dto/status-report.dto';

const REVIEW_ROLES: Role[] = [Role.SUPER_ADMIN];

type PersonLike = { id: string; Member: { firstName: string; lastName: string; photoUrl: string | null } | null } | null;

const PERSON_SELECT = { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } as const;

@Injectable()
export class StatusReportsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private personLabel(p: PersonLike) {
    if (!p) return null;
    const m = p.Member;
    return { profileId: p.id, name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown', photoUrl: m?.photoUrl ?? null };
  }

  private isReviewer(actor: AuthUser): boolean {
    return Boolean(actor.role && REVIEW_ROLES.includes(actor.role));
  }

  private async assertCanSubmit(actor: AuthUser, dto: CreateReportDto) {
    if (dto.scope === 'DEPARTMENT') {
      if (!dto.departmentId) throw new BadRequestException('departmentId is required for a department report');
      if (!actor.adminHeadOf?.includes(dto.departmentId)) {
        throw new ForbiddenException('You do not head this department');
      }
    } else if (dto.scope === 'UNIT') {
      if (!dto.unitId) throw new BadRequestException('unitId is required for a unit report');
      if (!actor.unitLeadOf?.includes(dto.unitId)) {
        throw new ForbiddenException('You do not lead this unit');
      }
    } else {
      // PASTOR — a personal report, not tied to any department/unit.
      if (actor.role !== Role.PASTOR) {
        throw new ForbiddenException('Only a Pastor can submit a pastoral report');
      }
    }
  }

  private readonly listInclude = {
    SubmittedBy: { select: PERSON_SELECT },
    ReviewedBy: { select: PERSON_SELECT },
    Department: { select: { id: true, name: true, code: true } },
    Unit: { select: { id: true, name: true } },
    _count: { select: { Comments: true } },
  } as const;

  private mapRow(r: any) {
    return {
      id: r.id,
      scope: r.scope,
      title: r.title,
      content: r.content,
      attachmentUrl: r.attachmentUrl,
      attachmentName: r.attachmentName,
      status: r.status,
      department: r.Department,
      unit: r.Unit,
      submittedBy: this.personLabel(r.SubmittedBy),
      reviewedBy: this.personLabel(r.ReviewedBy),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      commentCount: r._count?.Comments ?? 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  async create(actor: AuthUser, dto: CreateReportDto) {
    if (!actor.profileId) throw new ForbiddenException('No profile on your account');
    await this.assertCanSubmit(actor, dto);

    const row = await this.prisma.report.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        scope: dto.scope,
        departmentId: dto.scope === 'DEPARTMENT' ? dto.departmentId : null,
        unitId: dto.scope === 'UNIT' ? dto.unitId : null,
        submittedById: actor.profileId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        attachmentUrl: dto.attachmentUrl ?? null,
        attachmentName: dto.attachmentName ?? null,
        status: dto.status ?? 'SUBMITTED',
      },
      include: this.listInclude,
    });
    return this.mapRow(row);
  }

  /** Reports the actor themself submitted, including their own drafts — for
   * the My Department / My Unit / Pastoral Reports pages. */
  async listMine(actor: AuthUser) {
    if (!actor.profileId) return [];
    const rows = await this.prisma.report.findMany({
      where: { tenantId: this.tenantId, submittedById: actor.profileId },
      orderBy: { createdAt: 'desc' },
      include: this.listInclude,
    });
    return rows.map((r) => this.mapRow(r));
  }

  /** Every sent report — the Audit Log page. SUPER_ADMIN only (route-gated).
   * Unsent drafts never appear here regardless of the status filter. */
  async listAll(status?: string) {
    const rows = await this.prisma.report.findMany({
      where: { tenantId: this.tenantId, status: { not: 'DRAFT', ...(status ? { equals: status as any } : {}) } },
      orderBy: { createdAt: 'desc' },
      include: this.listInclude,
    });
    return rows.map((r) => this.mapRow(r));
  }

  private async findOwned(actor: AuthUser, id: string) {
    const row = await this.prisma.report.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { ...this.listInclude, Comments: { orderBy: { createdAt: 'asc' }, include: { Author: { select: PERSON_SELECT } } } },
    });
    if (!row) throw new NotFoundException('Report not found');
    if (!this.isReviewer(actor) && row.submittedById !== actor.profileId) {
      throw new ForbiddenException('This is not your report');
    }
    return row;
  }

  async getById(actor: AuthUser, id: string) {
    const row = await this.findOwned(actor, id);
    return {
      ...this.mapRow(row),
      comments: row.Comments.map((c) => ({
        id: c.id,
        content: c.content,
        author: this.personLabel(c.Author),
        isReviewer: c.authorId !== row.submittedById,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  /** Edit your own report. `dto.status` (when given) is how the author drives
   * DRAFT/SUBMITTED transitions — "Save as draft" sends 'DRAFT', "Send" sends
   * 'SUBMITTED'. Omitted, it preserves the existing behavior: a plain SUBMITTED
   * report is a silent edit-in-place, and resubmitting a NEEDS_CORRECTION report
   * clears the correction flag back to SUBMITTED. An APPROVED report is locked
   * (the review is final, preserving the audit trail). */
  async update(actor: AuthUser, id: string, dto: UpdateReportDto) {
    const row = await this.prisma.report.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!row) throw new NotFoundException('Report not found');
    if (row.submittedById !== actor.profileId) throw new ForbiddenException('This is not your report');
    if (row.status === 'APPROVED') {
      throw new BadRequestException('An approved report cannot be edited');
    }

    const nextStatus = dto.status ?? (row.status === 'NEEDS_CORRECTION' ? 'SUBMITTED' : row.status);

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        attachmentUrl: dto.attachmentUrl ?? row.attachmentUrl,
        attachmentName: dto.attachmentName ?? row.attachmentName,
        status: nextStatus,
        updatedAt: new Date(),
      },
      include: this.listInclude,
    });
    return this.mapRow(updated);
  }

  /** Delete your own report — blocked once APPROVED for the same reason edits are. */
  async remove(actor: AuthUser, id: string) {
    const row = await this.prisma.report.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!row) throw new NotFoundException('Report not found');
    if (row.submittedById !== actor.profileId) throw new ForbiddenException('This is not your report');
    if (row.status === 'APPROVED') {
      throw new BadRequestException('An approved report cannot be deleted');
    }
    await this.prisma.report.delete({ where: { id } });
    return { id, deleted: true };
  }

  async approve(actor: AuthUser, id: string) {
    const row = await this.prisma.report.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!row) throw new NotFoundException('Report not found');

    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: actor.profileId, reviewedAt: new Date() },
      include: this.listInclude,
    });
    return this.mapRow(updated);
  }

  async requestCorrection(actor: AuthUser, id: string, comment: string) {
    const row = await this.prisma.report.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!row) throw new NotFoundException('Report not found');
    if (!actor.profileId) throw new ForbiddenException('No profile on your account');

    const [updated] = await this.prisma.$transaction([
      this.prisma.report.update({
        where: { id },
        data: { status: 'NEEDS_CORRECTION', reviewedById: actor.profileId, reviewedAt: new Date() },
        include: this.listInclude,
      }),
      this.prisma.reportComment.create({
        data: { id: randomUUID(), tenantId: this.tenantId, reportId: id, authorId: actor.profileId, content: comment.trim() },
      }),
    ]);
    return this.mapRow(updated);
  }

  async addComment(actor: AuthUser, id: string, content: string) {
    if (!actor.profileId) throw new ForbiddenException('No profile on your account');
    await this.findOwned(actor, id); // throws 404/403 if not the author or a reviewer

    const comment = await this.prisma.reportComment.create({
      data: { id: randomUUID(), tenantId: this.tenantId, reportId: id, authorId: actor.profileId, content: content.trim() },
      include: { Author: { select: PERSON_SELECT } },
    });
    return {
      id: comment.id,
      content: comment.content,
      author: this.personLabel(comment.Author),
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
