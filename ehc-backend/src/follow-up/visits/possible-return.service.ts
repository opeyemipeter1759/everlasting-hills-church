import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { dateColumn, dayOf, lagosDay, prettyDay } from './visit-day.util';

type Db = Prisma.TransactionClient | PrismaService;
type FlaggedForm = { id: string; possibleReturnVisitorId: string | null; possibleReturnMemberId: string | null };

/**
 * A form that came in with a phone or email the church already has. Families
 * share phones, so staff decide: the same person (their visit goes on the
 * original record and the new form is archived) or a different person (the
 * flag is cleared). Records are never merged.
 */
@Injectable()
export class PossibleReturnService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Who this form may be: the earlier first-timer form, and the member, when either matched. */
  async match(visitorId: string) {
    const form = await this.form(this.prisma, visitorId);
    const original = await this.original(this.prisma, form);
    const member = form.possibleReturnMemberId
      ? await this.prisma.member.findFirst({
          where: { id: form.possibleReturnMemberId, tenantId: this.tenantId },
          select: { id: true, firstName: true, lastName: true },
        })
      : null;
    return {
      pending: this.flagged(form) && !form.possibleReturnResolvedAt,
      visitor: original
        ? { id: original.id, firstName: original.firstName, lastName: original.lastName, firstVisitDate: this.firstDay(original) }
        : null,
      member,
    };
  }

  /** Same person: a return visit on the original, dated this form's first visit, and this form archived. */
  async confirm(actor: AuthUser, visitorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const form = await tx.visitor.findFirst({ where: { id: visitorId, tenantId: this.tenantId } });
      if (!form) throw new NotFoundException('First-timer not found');
      if (!this.flagged(form)) throw new BadRequestException('This form is not flagged as a possible return visit');
      if (form.archivedAt || form.possibleReturnResolvedAt) throw new ConflictException('Someone has already answered this');
      const now = new Date();
      // Conditional, so a double tap or two staff at once cannot both confirm.
      const claimed = await tx.visitor.updateMany({
        where: { id: form.id, tenantId: this.tenantId, archivedAt: null, possibleReturnResolvedAt: null },
        data: { archivedAt: now, archivedById: actor.profileId, possibleReturnResolvedAt: now },
      });
      if (claimed.count !== 1) throw new ConflictException('Someone has already answered this');

      const day = this.firstDay(form);
      const original = await this.original(tx, form);
      if (original) {
        await tx.firstTimerVisit.createMany({
          data: [{ id: randomUUID(), tenantId: this.tenantId, visitorId: original.id, visitedOn: dateColumn(day), source: 'RETURN_FORM', recordedById: actor.profileId }],
          skipDuplicates: true,
        });
      } else if (form.possibleReturnMemberId && actor.profileId) {
        // A member who never filled in the form: nothing to add a visit to, so the team's thread says they came.
        await tx.followUpNote.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            subjectKind: 'MEMBER',
            subjectId: form.possibleReturnMemberId,
            authorId: actor.profileId,
            body: `Filled in the first-timer form again on ${prettyDay(day)}. Confirmed as the same person, so that form was archived.`,
          },
        });
      }
      await this.audit(tx, actor, { decision: 'SAME_PERSON', visitorId: original?.id ?? null, memberId: form.possibleReturnMemberId, date: day }, form.id);
      return { originalVisitorId: original?.id ?? null, memberId: form.possibleReturnMemberId, date: day };
    }, { timeout: 15_000 }); // a cold pooler connection can take longer than the 5 s default
  }

  /** Different person: the flag is cleared and both records stay exactly as they are. */
  async dismiss(actor: AuthUser, visitorId: string) {
    const form = await this.form(this.prisma, visitorId);
    if (!this.flagged(form)) throw new BadRequestException('This form is not flagged as a possible return visit');
    const cleared = await this.prisma.visitor.updateMany({
      where: { id: form.id, tenantId: this.tenantId, archivedAt: null, possibleReturnResolvedAt: null },
      data: { possibleReturnResolvedAt: new Date() },
    });
    if (cleared.count === 1) await this.audit(this.prisma, actor, { decision: 'DIFFERENT_PERSON' }, form.id);
    return { resolved: true };
  }

  private flagged(form: FlaggedForm): boolean {
    return !!(form.possibleReturnVisitorId || form.possibleReturnMemberId);
  }

  private async form(db: Db, visitorId: string) {
    const form = await db.visitor.findFirst({ where: { id: visitorId, tenantId: this.tenantId, archivedAt: null } });
    if (!form) throw new NotFoundException('First-timer not found');
    return form;
  }

  /** The earlier first-timer form: the one matched, else the form behind the matched member. Never this form itself. */
  private async original(db: Db, form: FlaggedForm) {
    const base = { tenantId: this.tenantId, archivedAt: null, NOT: { id: form.id } };
    const byVisitor = form.possibleReturnVisitorId
      ? await db.visitor.findFirst({ where: { ...base, id: form.possibleReturnVisitorId } })
      : null;
    if (byVisitor || !form.possibleReturnMemberId) return byVisitor;
    return db.visitor.findFirst({ where: { ...base, convertedToMemberId: form.possibleReturnMemberId }, orderBy: { submittedAt: 'asc' } });
  }

  private firstDay(v: { firstVisitDate: Date | null; submittedAt: Date }): string {
    return v.firstVisitDate ? dayOf(v.firstVisitDate) : lagosDay(v.submittedAt);
  }

  private async audit(db: Db, actor: AuthUser, after: Prisma.InputJsonValue, visitorId: string) {
    await db.auditLog.create({
      data: { id: randomUUID(), tenantId: this.tenantId, actorId: actor.userId, action: 'UPDATE', entity: 'Visitor', entityId: visitorId, before: Prisma.DbNull, after },
    });
  }
}
