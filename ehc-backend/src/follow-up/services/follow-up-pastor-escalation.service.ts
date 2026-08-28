import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FollowUpSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildFollowUpPastorEscalationEmail } from '../../notifications/templates/follow-up-pastor-escalation.email';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { buildWhatsAppLink } from '../follow-up-whatsapp.util';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpAuditService } from './follow-up-audit.service';
import { FollowUpNotifyService } from './follow-up-notify.service';

/**
 * A leader's deliberate choice to put a first-timer in front of the Pastor
 * personally — not every first-timer, and never automatic. Pre-fills the
 * Pastor's email + a WhatsApp deep link from the entry's own details so the
 * leader doesn't retype anything.
 */
@Injectable()
export class FollowUpPastorEscalationService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly audit: FollowUpAuditService,
    private readonly notify: FollowUpNotifyService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async sendToPastor(actor: AuthUser, id: string): Promise<{ entry: ReturnType<FollowUpEntryMapperService['mapEntry']>; whatsappLink: string | null }> {
    const entry = await this.prisma.followUpEntry.findFirst({
      where: { id, tenantId: this.tenantId },
      include: ENTRY_INCLUDE,
    });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (entry.sourceType !== FollowUpSourceType.FIRST_TIMER) {
      throw new BadRequestException('Only first-timers can be sent to the Pastor');
    }
    if (!this.auth.canLead(actor, entry.unitId)) {
      throw new ForbiddenException("Only this unit's leader can send to the Pastor");
    }
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');

    const updated = await this.prisma.followUpEntry.update({
      where: { id },
      data: { sentToPastorById: actor.profileId, sentToPastorAt: new Date() },
      include: ENTRY_INCLUDE,
    });

    await this.audit.write({
      action: 'SEND_TO_PASTOR',
      entity: 'FollowUpEntry',
      entityId: id,
      actorId: actor.userId,
    });

    const mapped = this.mapper.mapEntry(updated, actor);

    const senderProfile = await this.prisma.profile.findUnique({
      where: { id: actor.profileId },
      select: { Member: { select: { firstName: true, lastName: true } } },
    });
    const sentByName = senderProfile?.Member ? `${senderProfile.Member.firstName} ${senderProfile.Member.lastName}`.trim() : 'A team leader';

    const service = entry.Visitor?.serviceId
      ? await this.prisma.service.findUnique({ where: { id: entry.Visitor.serviceId }, select: { name: true } })
      : null;
    const lastNote = mapped.logs.length > 0 ? mapped.logs[mapped.logs.length - 1].note : null;

    const pastors = await this.notify.getPastorRecipients();
    for (const pastor of pastors) {
      if (pastor.email) {
        const [firstName] = pastor.name.split(' ');
        this.events.emit(
          NotificationEvents.SendEmail,
          buildFollowUpPastorEscalationEmail({
            to: pastor.email,
            pastorFirstName: firstName || 'Pastor',
            fullName: mapped.person.name,
            phone: mapped.person.phone,
            serviceName: service?.name ?? null,
            howTheyHeard: mapped.personDetail?.howTheyHeard ?? null,
            note: lastNote,
            sentByName,
            appUrl: this.notify.appUrl,
          }),
        );
      }
      await this.notify.notifyProfile(
        pastor.profileId,
        `First-timer for your call list: ${mapped.person.name}`,
        `Sent by ${sentByName}`,
        '/dashboard/pastor/follow-ups',
        'follow-up-pastor-escalation',
      );
    }

    const messageParts = [
      `Hi Pastor, ${sentByName} sent this first-timer for your call:`,
      mapped.person.name,
      mapped.person.phone ? `Phone: ${mapped.person.phone}` : null,
      service ? `Service: ${service.name}` : null,
      mapped.personDetail?.howTheyHeard ? `How they heard: ${mapped.personDetail.howTheyHeard}` : null,
      lastNote ? `Note: ${lastNote}` : null,
    ].filter(Boolean);
    const whatsappLink = buildWhatsAppLink(pastors.find((p) => p.phone)?.phone, messageParts.join('\n'));

    return { entry: mapped, whatsappLink };
  }
}
