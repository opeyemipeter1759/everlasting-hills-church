import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { normalizeNigerianPhone } from '../common/phone.util';
import type { UpdateVisitorDto } from './dto/update-visitor.dto';
import { visitorsOnRecord } from './visitors-on-record';
import { firstTimerAdminPage, type FirstTimerAdminFilters } from './first-timer-admin-list';
import { cancelPendingApprovals } from '../follow-up/approvals/approval-cancel';

/**
 * Visitor queries + admin edit/archive for first-timer records.
 *
 * Visitor records are CREATED by FormsService (first-timer registration).
 * Conversion to a Member happens via MembersService.convertVisitorToMember —
 * this module covers everything else: listing, editing corrections
 * (misspelled names, wrong phone numbers), and archiving bad/duplicate rows.
 * First-timers are never deleted: an archived one drops out of every list
 * and count, and the audit log says who archived them.
 */
@Injectable()
export class VisitorsService {
  private readonly tenantId: string;

  constructor(prisma: PrismaService, config: ConfigService<Env, true>) {
    this.prisma = prisma;
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private readonly prisma: PrismaService;

  /** Only unconverted visitors: once someone has a member account, they drop off this list. Archived ones never show. */
  async list(opts: { limit?: number; search?: string } = {}) {
    const where: Record<string, unknown> = { tenantId: this.tenantId, convertedAt: null, archivedAt: null };
    if (opts.search) {
      where.OR = [
        { firstName: { contains: opts.search, mode: 'insensitive' } },
        { lastName: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { phone: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.visitor.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: opts.limit ?? 50,
    });
  }

  /**
   * First-timers who asked to join the WhatsApp community.
   *
   * "waiting" is the church's to-do list, oldest ask first, because somebody
   * who asked three Sundays ago is the one being let down. Marking a person
   * added is the action; it is not a deletion, so it can be undone.
   */
  async whatsappCommunity(opts: { includeAdded?: boolean } = {}) {
    const select = {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      submittedAt: true,
      whatsappAddedAt: true,
    };
    const where = { tenantId: this.tenantId, archivedAt: null, whatsappInterest: true };
    const [waiting, added] = await Promise.all([
      this.prisma.visitor.findMany({
        where: { ...where, whatsappAddedAt: null },
        orderBy: { submittedAt: 'asc' },
        select,
      }),
      opts.includeAdded
        ? this.prisma.visitor.findMany({
            where: { ...where, whatsappAddedAt: { not: null } },
            orderBy: { whatsappAddedAt: 'desc' },
            take: 20,
            select,
          })
        : Promise.resolve([]),
    ]);
    return { waiting, added };
  }

  /** Records that this person is now in the community, or puts them back on the list. */
  async setWhatsappAdded(id: string, added: boolean, actorProfileId: string | null) {
    const { count } = await this.prisma.visitor.updateMany({
      where: { id, tenantId: this.tenantId },
      data: added
        ? { whatsappAddedAt: new Date(), whatsappAddedBy: actorProfileId }
        : { whatsappAddedAt: null, whatsappAddedBy: null },
    });
    if (count === 0) throw new NotFoundException('Visitor not found');
    return { id, added };
  }

  async getById(id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }

  async count() {
    return this.prisma.visitor.count({ where: { tenantId: this.tenantId, archivedAt: null } });
  }

  /** The admin First Timers page: a page of forms and the counts beside it, from one query. */
  /** First-timers who wrote a prayer request on the form, newest first. */
  async prayerPoints() {
    const rows = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, archivedAt: null, prayerPoint: { not: null } },
      orderBy: { submittedAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, phone: true, submittedAt: true, firstVisitDate: true, prayerPoint: true },
    });
    return rows
      .filter((r) => (r.prayerPoint ?? '').trim().length > 0)
      .map((r) => ({
        visitorId: r.id,
        name: `${r.firstName} ${r.lastName}`.trim(),
        phone: r.phone,
        submittedAt: r.submittedAt.toISOString(),
        firstVisitDate: r.firstVisitDate ? r.firstVisitDate.toISOString().slice(0, 10) : null,
        prayerPoint: (r.prayerPoint ?? '').trim(),
      }));
  }

  async firstTimers(filters: FirstTimerAdminFilters) {
    return firstTimerAdminPage(this.prisma, this.tenantId, filters);
  }

  async update(id: string, dto: UpdateVisitorDto) {
    await this.getById(id); // 404s if missing/wrong tenant, same as getById

    if (dto.email) {
      const clash = await this.prisma.visitor.findFirst({
        where: { tenantId: this.tenantId, email: dto.email, id: { not: id } },
        select: { id: true },
      });
      if (clash) throw new ConflictException(`Another visitor already uses email "${dto.email}"`);
    }
    // Stored as 234XXXXXXXXXX, the form WhatsApp links need, however it was typed.
    const phone = dto.phone === undefined ? undefined : normalizeNigerianPhone(dto.phone);
    if (phone) {
      const clash = await this.prisma.visitor.findFirst({
        where: { tenantId: this.tenantId, phone, id: { not: id } },
        select: { id: true },
      });
      if (clash) throw new ConflictException(`Another visitor already uses phone "${phone}"`);
    }

    return this.prisma.visitor.update({ where: { id }, data: { ...dto, ...(phone !== undefined ? { phone } : {}) } });
  }

  /**
   * Archives a first-timer instead of deleting them: they drop out of every
   * list and count, while their record, their Follow Up conversation and their
   * history stay, and the audit log says who archived them and when.
   */
  async archive(id: string, actor: Pick<AuthUser, 'userId' | 'profileId'>) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, tenantId: this.tenantId, archivedAt: null },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    const archivedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.visitor.update({ where: { id }, data: { archivedAt, archivedById: actor.profileId } });
      // An archived first-timer has nothing left to approve.
      await cancelPendingApprovals(tx, { tenantId: this.tenantId, subjectType: 'VISITOR', subjectId: id, actorId: actor.profileId, note: 'Archived' });
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: actor.userId,
          action: 'ARCHIVE',
          entity: 'Visitor',
          entityId: id,
          before: { firstName: visitor.firstName, lastName: visitor.lastName, phone: visitor.phone, email: visitor.email },
          after: { archivedAt: archivedAt.toISOString(), archivedById: actor.profileId },
        },
      });
    });
    return { id, archived: true, archivedAt: archivedAt.toISOString() };
  }

  /** First timers on record (the same total the Follow Up page shows), broken
   * down by attendance type. Same in-person/online matching convention as
   * AnalyticsService.getFirstTimerPipeline. */
  async getStats() {
    const onRecord = await visitorsOnRecord(this.prisma, this.tenantId);
    const [total, onsite, online] = await Promise.all([
      this.prisma.visitor.count({ where: onRecord }),
      this.prisma.visitor.count({ where: { ...onRecord, attendanceType: { contains: 'person', mode: 'insensitive' } } }),
      this.prisma.visitor.count({ where: { ...onRecord, attendanceType: { contains: 'online', mode: 'insensitive' } } }),
    ]);
    return { total, onsite, online };
  }
}
