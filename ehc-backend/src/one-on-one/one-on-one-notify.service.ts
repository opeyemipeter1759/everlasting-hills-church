import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { PastoralMeetingFormat } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { NotificationEvents } from '../notifications/notification-events';
import { buildPastoralSessionEmail } from '../notifications/templates/pastoral-session.email';
import { PushDispatchService } from '../push/services/push-dispatch.service';

export interface NotifyBooking {
  id: string;
  hostId: string;
  coHostId: string | null;
  hostName: string;
  coHostName: string | null;
  typeName: string;
  memberProfileId: string | null;
  requesterName: string;
  requesterEmail: string;
  startsAt: Date;
  endsAt: Date;
  proposedStartsAt: Date | null;
  proposedEndsAt: Date | null;
  format: PastoralMeetingFormat;
  topic: string;
}

export type RequesterEvent = 'RECEIVED' | 'APPROVED' | 'PROPOSED' | 'DECLINED' | 'CANCELLED_BY_HOST';
export type HostEvent = 'NEW' | 'ACCEPTED_PROPOSAL' | 'WITHDRAWN';

const FORMAT_LABEL: Record<PastoralMeetingFormat, string> = {
  IN_PERSON: 'In person, at the church office',
  GOOGLE_MEET: 'Google Meet (the link will follow)',
  PHONE: 'Phone call',
};

/** "Thursday 12 November, 13:00–14:00 (Lagos time)". */
export function formatWhen(start: Date, end: Date): string {
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' }).format(start);
  const time = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }).format(d);
  return `${day}, ${time(start)}–${time(end)} (Lagos time)`;
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/** Sends every One-on-One email and push. Never throws: a failed notification must not undo a decision. */
@Injectable()
export class OneOnOneNotifyService {
  private readonly logger = new Logger(OneOnOneNotifyService.name);
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly push: PushDispatchService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  private get tenantId(): string {
    return this.config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private pastorsLabel(b: NotifyBooking): string {
    return b.coHostName ? `${b.hostName} and ${b.coHostName}` : b.hostName;
  }

  /** The pastor(s) on a session and everyone they've delegated to, once each. */
  private async hostSide(hostIds: string[]) {
    const hosts = await this.prisma.pastorHost.findMany({
      where: { id: { in: hostIds } },
      select: {
        profileId: true,
        Profile: { select: { Member: { select: { firstName: true, lastName: true, email: true } } } },
        Delegates: { select: { delegateProfileId: true, Delegate: { select: { Member: { select: { firstName: true, lastName: true, email: true } } } } } },
      },
    });
    const people = new Map<string, { name: string; email: string | null }>();
    const add = (profileId: string, m: { firstName: string; lastName: string; email: string | null } | null) => {
      if (!people.has(profileId)) people.set(profileId, { name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Pastor', email: m?.email ?? null });
    };
    for (const h of hosts) {
      add(h.profileId, h.Profile.Member);
      for (const d of h.Delegates) add(d.delegateProfileId, d.Delegate.Member);
    }
    return people;
  }

  async toHostSide(b: NotifyBooking, event: HostEvent): Promise<void> {
    try {
      const people = await this.hostSide([b.hostId, ...(b.coHostId ? [b.coHostId] : [])]);
      const when = formatWhen(b.startsAt, b.endsAt);
      const copy = {
        NEW: {
          subject: `New one-on-one request: ${b.requesterName}, ${when}`,
          heading: 'New request',
          line: `${b.requesterName} has asked to meet ${this.pastorsLabel(b)}. Approve it, suggest another time, or decline.`,
          push: `${b.requesterName} asked for ${b.typeName} on ${when}.`,
        },
        ACCEPTED_PROPOSAL: {
          subject: `${b.requesterName} accepted the new time`,
          heading: 'New time accepted',
          line: `${b.requesterName} accepted the time you suggested. The session is now booked.`,
          push: `${b.requesterName} accepted ${when}.`,
        },
        WITHDRAWN: {
          subject: `${b.requesterName} withdrew their one-on-one request`,
          heading: 'Request withdrawn',
          line: `${b.requesterName} has withdrawn their request. The time is free again.`,
          push: `${b.requesterName} withdrew their request for ${when}.`,
        },
      }[event];

      for (const person of people.values()) {
        if (!person.email) continue;
        this.events.emit(
          NotificationEvents.SendEmail,
          buildPastoralSessionEmail({
            to: person.email,
            name: firstName(person.name),
            subject: copy.subject,
            heading: copy.heading,
            paragraphs: [copy.line],
            details: [
              ['With', this.pastorsLabel(b)],
              ['Session', b.typeName],
              ['When', when],
              ['How', FORMAT_LABEL[b.format]],
              ['About', b.topic],
            ],
            cta: { label: 'Open One-on-One', href: `${this.appUrl}/dashboard/one-on-one/manage` },
            tag: `pastoral-host-${event.toLowerCase()}`,
          }),
        );
      }

      await this.push.dispatch(
        'pastoralRequests',
        { userIds: [...people.keys()], tenantId: this.tenantId },
        { title: copy.heading, body: copy.push, url: '/dashboard/one-on-one/manage', tag: `pastoral-${b.id}` },
      );
    } catch (err) {
      this.logger.error(`One-on-One host notification (${event}) failed for ${b.id}: ${(err as Error).message}`);
    }
  }

  async toRequester(b: NotifyBooking, event: RequesterEvent, note?: string | null): Promise<void> {
    try {
      const pastors = this.pastorsLabel(b);
      const when = formatWhen(b.startsAt, b.endsAt);
      const proposedWhen = b.proposedStartsAt && b.proposedEndsAt ? formatWhen(b.proposedStartsAt, b.proposedEndsAt) : when;
      const copy = {
        RECEIVED: {
          subject: `Your request to meet ${pastors}`,
          heading: 'Request sent',
          paragraphs: [`Thank you. Your request to meet ${pastors} has been sent, and the time is held for you.`, "We'll let you know as soon as it's approved."],
          details: [['When', when]] as [string, string][],
          push: null as string | null,
        },
        APPROVED: {
          subject: `Approved: your session with ${pastors}`,
          heading: 'Your session is approved',
          paragraphs: [`${pastors} will see you then. We'll remind you the day before and an hour before.`],
          details: [['When', when]] as [string, string][],
          push: `${pastors} approved your session on ${when}.`,
        },
        PROPOSED: {
          subject: `${pastors} suggested a different time`,
          heading: 'A different time',
          paragraphs: [`${pastors} can't make the time you asked for and suggested another. Accept it, or pick a different time.`],
          details: [
            ['Suggested', proposedWhen],
            ['You asked for', when],
          ] as [string, string][],
          push: `${pastors} suggested ${proposedWhen}.`,
        },
        DECLINED: {
          subject: `About your request to meet ${pastors}`,
          heading: 'Request not approved',
          paragraphs: [`${pastors} isn't able to take this session. You're welcome to request another time.`],
          details: [['You asked for', when]] as [string, string][],
          push: `${pastors} couldn't take your session on ${when}.`,
        },
        CANCELLED_BY_HOST: {
          subject: `Your session with ${pastors} has been cancelled`,
          heading: 'Session cancelled',
          paragraphs: [`Your session with ${pastors} has had to be cancelled. You're welcome to request another time.`],
          details: [['Was', when]] as [string, string][],
          push: `Your session on ${when} has been cancelled.`,
        },
      }[event];

      this.events.emit(
        NotificationEvents.SendEmail,
        buildPastoralSessionEmail({
          to: b.requesterEmail,
          name: firstName(b.requesterName),
          subject: copy.subject,
          heading: copy.heading,
          paragraphs: copy.paragraphs,
          details: [['With', pastors], ['Session', b.typeName], ...copy.details, ['How', FORMAT_LABEL[b.format]]],
          quote: note ? { label: `A note from ${pastors}`, text: note } : null,
          cta: { label: 'View your sessions', href: `${this.appUrl}/dashboard/one-on-one` },
          tag: `pastoral-requester-${event.toLowerCase()}`,
        }),
      );

      if (copy.push && b.memberProfileId) {
        await this.push.dispatch(
          'pastoralSessionUpdates',
          { userIds: [b.memberProfileId], tenantId: this.tenantId },
          { title: copy.heading, body: copy.push, url: '/dashboard/one-on-one', tag: `pastoral-${b.id}` },
        );
      }
    } catch (err) {
      this.logger.error(`One-on-One requester notification (${event}) failed for ${b.id}: ${(err as Error).message}`);
    }
  }
}
