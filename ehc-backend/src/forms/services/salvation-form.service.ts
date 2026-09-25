import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SalvationDecisionType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { SalvationDecisionDto } from '../dto/salvation.dto';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

/** Everything an admin needs to respond, in one row. */
const FULL_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  decision: true,
  location: true,
  churchName: true,
  interestedInBaptism: true,
  message: true,
  note: true,
  contactedAt: true,
  createdAt: true,
  Event: { select: { id: true, slug: true, title: true } },
  Member: { select: { id: true, firstName: true, lastName: true, email: true } },
  ContactedBy: { select: { id: true, Member: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.SalvationDecisionSelect;

@Injectable()
export class SalvationFormService {
  private readonly logger = new Logger(SalvationFormService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** memberId is set only when the submitter is signed in (optional auth). */
  async submit(data: SalvationDecisionDto, memberId: string | null = null) {
    // The event is a nice-to-have link, not a precondition: an unknown slug
    // must never cost somebody their decision.
    let eventId: string | null = null;
    if (data.event_slug) {
      const event = await this.prisma.event.findFirst({
        where: { tenantId: this.tenantId, slug: data.event_slug.trim() },
        select: { id: true },
      });
      eventId = event?.id ?? null;
    }

    const record = await this.prisma.salvationDecision.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        firstName: data.first_name.trim(),
        lastName: data.last_name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        decision: data.decision,
        location: data.location?.trim() || null,
        churchName: data.church_name?.trim() || null,
        interestedInBaptism: data.interested_in_baptism ?? null,
        message: data.message?.trim() || null,
        eventId,
        memberId,
        updatedAt: new Date(),
      },
      select: FULL_SELECT,
    });

    // Fire-and-forget: the team hears immediately, but a mail failure must not
    // fail the submission.
    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `${decisionLabel(record.decision)} — ${record.firstName} ${record.lastName}`,
      text: buildAdminText(record),
      tag: 'salvation-decision',
    });

    return record;
  }

  /** Admin list — every field, newest first. */
  async list(params: { contacted?: boolean } = {}) {
    return this.prisma.salvationDecision.findMany({
      where: {
        tenantId: this.tenantId,
        ...(params.contacted === true && { contactedAt: { not: null } }),
        ...(params.contacted === false && { contactedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: FULL_SELECT,
    });
  }

  /** Mark somebody as reached, or un-mark them, and keep the pastoral note. */
  async setContacted(id: string, contacted: boolean, profileId: string | null, note?: string) {
    const existing = await this.prisma.salvationDecision.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Decision not found');

    return this.prisma.salvationDecision.update({
      where: { id },
      data: {
        contactedAt: contacted ? new Date() : null,
        contactedById: contacted ? profileId : null,
        ...(note !== undefined && { note: note.trim() || null }),
      },
      select: FULL_SELECT,
    });
  }
}

function decisionLabel(decision: SalvationDecisionType): string {
  return decision === SalvationDecisionType.FIRST_TIME
    ? 'Gave their life to Christ'
    : 'Rededicated their life to Christ';
}

/** The whole submission in the notification — an admin should not have to open
 * the dashboard to know who to call and why. */
function buildAdminText(record: {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  decision: SalvationDecisionType;
  location: string | null;
  churchName: string | null;
  interestedInBaptism: boolean | null;
  message: string | null;
  Event: { title: string } | null;
}): string {
  const lines = [
    `${record.firstName} ${record.lastName} — ${decisionLabel(record.decision)}`,
    '',
    `Email: ${record.email ?? 'not given'}`,
    `Phone: ${record.phone ?? 'not given'}`,
    `Location: ${record.location ?? 'not given'}`,
    `Church: ${record.churchName ?? 'not given'}`,
    `Interested in baptism: ${record.interestedInBaptism === null ? 'not asked' : record.interestedInBaptism ? 'Yes' : 'No'}`,
  ];
  if (record.Event) lines.push(`From: ${record.Event.title}`);
  if (record.message) lines.push('', 'Their message:', record.message);
  return lines.join('\n');
}
