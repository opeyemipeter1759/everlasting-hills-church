import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FollowUpReportSentVia, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildFollowUpServiceReportEmail } from '../../notifications/templates/follow-up-service-report.email';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { buildWhatsAppLink } from '../follow-up-whatsapp.util';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpNotifyService } from './follow-up-notify.service';

export interface ServiceReportStats {
  total: number;
  reached: number;
  unreachable: number;
  connectionsIntroduced: number;
  outstanding: number;
}

export type ServiceReportRecipientGroup = 'PASTOR' | 'ADMIN_HEAD';

/**
 * A leader's per-service report to the Admin Head and Pastor. Compiling reuses
 * the exact serviceId/unitId entry filter the Master List's service-day filter
 * already uses, so "what happened at this service" means the same thing
 * everywhere. Sending it is the close-out action for that service's work —
 * entryIds records exactly what was covered so nothing rolls over unflagged.
 */
@Injectable()
export class FollowUpServiceReportService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly notify: FollowUpNotifyService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private entriesWhere(unitId: string, serviceId: string): Prisma.FollowUpEntryWhereInput {
    return {
      tenantId: this.tenantId,
      unitId,
      OR: [
        { sourceType: 'FIRST_TIMER' as const, Visitor: { serviceId } },
        { sourceType: 'ABSENTEE' as const, Member: { AttendanceRecord: { none: { serviceId, present: true } } } },
      ],
    };
  }

  private async fetchEntries(actor: AuthUser, unitId: string, serviceId: string) {
    const raw = await this.prisma.followUpEntry.findMany({
      where: this.entriesWhere(unitId, serviceId),
      include: ENTRY_INCLUDE,
    });
    return raw.map((e) => this.mapper.mapEntry(e, actor));
  }

  private computeStats(entries: ReturnType<FollowUpEntryMapperService['mapEntry']>[]): ServiceReportStats {
    let reached = 0;
    let unreachable = 0;
    let outstanding = 0;
    let connectionsIntroduced = 0;
    for (const e of entries) {
      const wasReached = e.logs.some((l) => l.kind === 'CONTACT' && l.outcome === 'REACHED');
      if (e.contactCount === 0) outstanding += 1;
      else if (wasReached) reached += 1;
      else unreachable += 1;
      connectionsIntroduced += e.connections.filter((c) => c.status === 'INTRODUCED' || c.status === 'CONNECTED').length;
    }
    return { total: entries.length, reached, unreachable, connectionsIntroduced, outstanding };
  }

  private draftSummary(unitName: string, serviceName: string, entries: ReturnType<FollowUpEntryMapperService['mapEntry']>[], stats: ServiceReportStats): string {
    const opening = `On ${serviceName}, the ${unitName} team followed up with ${stats.total} ${stats.total === 1 ? 'person' : 'people'} — ${stats.reached} reached, ${stats.unreachable} not yet reachable, and ${stats.outstanding} still to contact.${stats.connectionsIntroduced > 0 ? ` ${stats.connectionsIntroduced} new connection${stats.connectionsIntroduced === 1 ? '' : 's'} introduced.` : ''}`;

    const noteLines = entries
      .filter((e) => e.logs.length > 0)
      .slice(0, 10)
      .map((e) => `- ${e.person.name}: ${e.logs[e.logs.length - 1].note}`);

    return noteLines.length > 0 ? `${opening}\n\nNotes:\n${noteLines.join('\n')}` : opening;
  }

  async compileDraft(actor: AuthUser, unitId: string, serviceId: string) {
    if (!this.auth.canLead(actor, unitId)) throw new ForbiddenException("Only this unit's leader can compile its report");

    const [unit, service, entries, pastors, adminHeads] = await Promise.all([
      this.prisma.unit.findFirst({ where: { id: unitId, tenantId: this.tenantId }, select: { name: true } }),
      this.prisma.service.findFirst({ where: { id: serviceId, tenantId: this.tenantId }, select: { name: true } }),
      this.fetchEntries(actor, unitId, serviceId),
      this.notify.getPastorRecipients(),
      this.notify.getUnitAdminHeadRecipients(unitId),
    ]);
    if (!unit || !service) throw new NotFoundException('Unit or service not found');

    const stats = this.computeStats(entries);
    return {
      summaryText: this.draftSummary(unit.name, service.name, entries, stats),
      stats,
      entryIds: entries.map((e) => e.id),
      outstandingEntries: entries.filter((e) => e.contactCount === 0).map((e) => ({ id: e.id, name: e.person.name })),
      // Who's actually available to send to — lets the leader see real names before
      // picking, and disable a group with nobody currently in that role.
      recipients: { pastors, adminHeads },
    };
  }

  async send(
    actor: AuthUser,
    unitId: string,
    serviceId: string,
    dto: { summaryText: string; sentVia?: FollowUpReportSentVia; recipients?: ServiceReportRecipientGroup[] },
  ) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    if (!this.auth.canLead(actor, unitId)) throw new ForbiddenException("Only this unit's leader can send its report");

    const [unit, service, entries] = await Promise.all([
      this.prisma.unit.findFirst({ where: { id: unitId, tenantId: this.tenantId }, select: { name: true } }),
      this.prisma.service.findFirst({ where: { id: serviceId, tenantId: this.tenantId }, select: { name: true, scheduledAt: true } }),
      this.fetchEntries(actor, unitId, serviceId),
    ]);
    if (!unit || !service) throw new NotFoundException('Unit or service not found');

    const stats = this.computeStats(entries);
    const sentVia = dto.sentVia ?? FollowUpReportSentVia.BOTH;

    const report = await this.prisma.serviceFollowUpReport.upsert({
      where: { tenantId_serviceId_unitId: { tenantId: this.tenantId, serviceId, unitId } },
      update: {
        summaryText: dto.summaryText,
        stats: stats as unknown as Prisma.InputJsonValue,
        sentVia,
        sentAt: new Date(),
        entryIds: entries.map((e) => e.id),
        compiledById: actor.profileId,
      },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        serviceId,
        unitId,
        compiledById: actor.profileId,
        summaryText: dto.summaryText,
        stats: stats as unknown as Prisma.InputJsonValue,
        sentVia,
        sentAt: new Date(),
        entryIds: entries.map((e) => e.id),
      },
    });

    const senderProfile = await this.prisma.profile.findUnique({
      where: { id: actor.profileId },
      select: { Member: { select: { firstName: true, lastName: true } } },
    });
    const compiledByName = senderProfile?.Member ? `${senderProfile.Member.firstName} ${senderProfile.Member.lastName}`.trim() : 'A team leader';

    // Omitted (undefined) means "both", matching the pre-selection UI default —
    // an explicit list restricts to just those groups, and must have been
    // validated non-empty by the DTO so a leader can't silently send to no one.
    const wantAdminHead = !dto.recipients || dto.recipients.includes('ADMIN_HEAD');
    const wantPastor = !dto.recipients || dto.recipients.includes('PASTOR');
    const recipients = [
      ...(wantAdminHead ? await this.notify.getUnitAdminHeadRecipients(unitId) : []),
      ...(wantPastor ? await this.notify.getPastorRecipients() : []),
    ];
    for (const recipient of recipients) {
      if (recipient.email && sentVia !== FollowUpReportSentVia.WHATSAPP) {
        const [firstName] = recipient.name.split(' ');
        this.events.emit(
          NotificationEvents.SendEmail,
          buildFollowUpServiceReportEmail({
            to: recipient.email,
            recipientFirstName: firstName || 'there',
            unitName: unit.name,
            serviceName: service.name,
            compiledByName,
            summaryText: dto.summaryText,
            stats,
            appUrl: this.notify.appUrl,
          }),
        );
      }
      await this.notify.notifyProfile(
        recipient.profileId,
        `Follow-Up report — ${unit.name} (${service.name})`,
        `Sent by ${compiledByName}`,
        '/dashboard/follow-up',
        'follow-up-service-report',
      );
    }

    const whatsappLink =
      sentVia !== FollowUpReportSentVia.EMAIL
        ? buildWhatsAppLink(recipients.find((r) => r.phone)?.phone, `${unit.name} — ${service.name} Follow-Up report\n\n${dto.summaryText}`)
        : null;

    return {
      report: { ...report, Service: { name: service.name, scheduledAt: service.scheduledAt }, Unit: { name: unit.name }, compiledByName },
      whatsappLink,
    };
  }

  async history(actor: AuthUser, unitId?: string) {
    if (unitId && !this.auth.canLead(actor, unitId)) throw new ForbiddenException('You can only view your own team\'s reports');
    const rows = await this.prisma.serviceFollowUpReport.findMany({
      where: { tenantId: this.tenantId, sentAt: { not: null }, ...(unitId ? { unitId } : {}) },
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: {
        Service: { select: { name: true, scheduledAt: true } },
        Unit: { select: { name: true } },
        CompiledBy: { select: { Member: { select: { firstName: true, lastName: true } } } },
      },
    });
    return rows.map(({ CompiledBy, ...row }) => ({
      ...row,
      compiledByName: CompiledBy?.Member ? `${CompiledBy.Member.firstName} ${CompiledBy.Member.lastName}`.trim() : 'A team leader',
    }));
  }
}
