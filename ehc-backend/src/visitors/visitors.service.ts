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
import { deleteVisitor } from './visitor-delete';
import { FirstTimerPhotoStorage } from '../follow-up/photos/first-timer-photo-storage.service';

/**
 * Visitor queries + admin edit/delete for first-timer records.
 *
 * Visitor records are CREATED by FormsService (first-timer registration).
 * Conversion to a Member happens via MembersService.convertVisitorToMember —
 * this module covers everything else: listing, editing corrections
 * (misspelled names, wrong phone numbers), and archiving bad/duplicate rows.
 * Deleting a first-timer removes them for good; the audit trail keeps a copy
 * of their details and says who deleted them.
 */
@Injectable()
export class VisitorsService {
  private readonly tenantId: string;

  constructor(
    prisma: PrismaService,
    config: ConfigService<Env, true>,
    private readonly photos: FirstTimerPhotoStorage,
  ) {
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
   * Deletes a first-timer for good, with everything that hangs off them (see
   * deleteVisitor). A copy of their details goes to the audit trail, with who
   * deleted them. Their photo, if any, is removed from storage afterwards.
   */
  async delete(id: string, actor: Pick<AuthUser, 'userId' | 'profileId'>) {
    const deleted = await this.prisma.$transaction((tx) => deleteVisitor(tx, this.tenantId, id, actor.userId), { maxWait: 20_000, timeout: 60_000 });
    if (!deleted) throw new NotFoundException('Visitor not found');
    if (deleted.photoKey) await this.photos.remove([deleted.photoKey]);
    return { id, deleted: true, name: deleted.name, removed: deleted.removed };
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
