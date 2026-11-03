import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { PastoralMeetingFormat, PastoralRequesterType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { NotificationEvents } from '../notifications/notification-events';
import { buildPastoralSessionEmail } from '../notifications/templates/pastoral-session.email';
import { PushDispatchService } from '../push/services/push-dispatch.service';
import { OneOnOneLinksService } from './one-on-one-links.service';

export interface NotifyBooking {
  id: string;
  hostId: string;
  coHostId: string | null;
  hostName: string;
  coHostName: string | null;
  typeName: string;
  requesterType: PastoralRequesterType;
  memberProfileId: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterTimezone: string | null;
  startsAt: Date;
  endsAt: Date;
  proposedStartsAt: Date | null;
  proposedEndsAt: Date | null;
  format: PastoralMeetingFormat;
  topic: string | null;
  meetLink: string | null;
  /** From the nameless public page and not yet taken up by a named pastor. */
  anonymous?: boolean;
}

export type RequesterEvent =
  | 'VERIFY'
  | 'RECEIVED'
  | 'APPROVED'
  | 'PROPOSED'
  | 'DECLINED'
  | 'CANCELLED_BY_HOST'
  | 'LAPSED'
  | 'LINK_UPDATED'
  | 'REMINDER_DAY'
  | 'REMINDER_HOUR';
export type HostEvent = 'NEW' | 'ASSIGNED' | 'ACCEPTED_PROPOSAL' | 'WITHDRAWN' | 'NUDGE' | 'REMINDER_DAY';

const LAGOS = 'Africa/Lagos';

const FORMAT_LABEL: Record<PastoralMeetingFormat, string> = {
  IN_PERSON: 'In person, at the church office in Ibadan',
  GOOGLE_MEET: 'Video call (Google Meet or Zoom)',
  PHONE: 'Phone call',
};

function range(start: Date, end: Date, timeZone: string): { day: string; times: string } {
  const day = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(start);
  const t = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(d);
  return { day, times: `${t(start)}–${t(end)}` };
}

/** "Thursday 12 November, 13:00–14:00 (Lagos time)". */
export function formatWhen(start: Date, end: Date): string {
  const r = range(start, end, LAGOS);
  return `${r.day}, ${r.times} (Lagos time)`;
}

/** Visitors abroad read the time in their own zone first, with Lagos alongside. */
export function formatWhenFor(start: Date, end: Date, timeZone: string | null): string {
  if (!timeZone || timeZone === LAGOS) return formatWhen(start, end);
  try {
    const own = range(start, end, timeZone);
    const lagos = range(start, end, LAGOS);
    if (own.times === lagos.times && own.day === lagos.day) return formatWhen(start, end);
    return `${own.day}, ${own.times} your time (${lagos.times} in Lagos)`;
  } catch {
    return formatWhen(start, end);
  }
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/** Sends every One-on-One email and push. Never throws: a failed notification must not undo a decision. */
@Injectable()
export class OneOnOneNotifyService {
  private readonly logger = new Logger(OneOnOneNotifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly push: PushDispatchService,
    private readonly links: OneOnOneLinksService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get tenantId(): string {
    return this.config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private pastorsLabel(b: NotifyBooking): string {
    return b.coHostName ? `${b.hostName} and ${b.coHostName}` : b.hostName;
  }

  /** Where the requester goes to see or change their session. */
  requesterUrl(b: Pick<NotifyBooking, 'id' | 'requesterType'>): string {
    return b.requesterType === 'VISITOR' ? this.links.visitorUrl(b.id) : this.links.memberUrl;
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

  async toHostSide(b: NotifyBooking, event: HostEvent, note?: string | null): Promise<void> {
    try {
      const people = await this.hostSide([b.hostId, ...(b.coHostId ? [b.coHostId] : [])]);
      const when = formatWhen(b.startsAt, b.endsAt);
      const who = b.requesterType === 'VISITOR' ? `${b.requesterName} (a visitor)` : b.requesterName;
      const copy = {
        NEW: {
          subject: `New one-on-one request: ${b.requesterName}, ${when}`,
          heading: 'New request',
          line: `${who} has asked to meet ${this.pastorsLabel(b)}. Approve it, suggest another time, or decline.`,
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
          line: `${b.requesterName} has withdrawn. The time is free again.`,
          push: `${b.requesterName} withdrew their request for ${when}.`,
        },
        ASSIGNED: {
          subject: `A request passed to you: ${b.requesterName}, ${when}`,
          heading: 'A request for you',
          line: `${who}’s request has been passed to you. Approve it, suggest another time, or decline.`,
          push: `${b.requesterName}'s request for ${when} has been passed to you.`,
        },
        NUDGE: {
          subject: `Still waiting: ${b.requesterName}'s request for ${when}`,
          heading: 'A request is waiting',
          line: `${who} is still waiting to hear back. If it isn't answered before the time comes, it will lapse and they'll be told.`,
          push: `${b.requesterName} is still waiting for an answer about ${when}.`,
        },
        REMINDER_DAY: {
          subject: `Tomorrow: one-on-one with ${b.requesterName}`,
          heading: 'Session tomorrow',
          line: `A reminder that you're meeting ${who} tomorrow.`,
          push: `Tomorrow: ${b.requesterName}, ${when}.`,
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
              ...(b.topic ? ([['About', b.topic]] as [string, string][]) : []),
              ...(b.meetLink ? ([['Meet link', b.meetLink]] as [string, string][]) : []),
            ],
            quote: note ? { label: event === 'WITHDRAWN' ? `${firstName(b.requesterName)}'s reason` : 'A note with it', text: note } : null,
            cta: { label: 'Open One-on-One', href: this.links.manageUrl },
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
      const pastors = b.anonymous ? 'one of our pastors' : this.pastorsLabel(b);
      const Pastors = pastors.charAt(0).toUpperCase() + pastors.slice(1);
      const tz = b.requesterTimezone;
      const when = formatWhenFor(b.startsAt, b.endsAt, tz);
      const proposedWhen = b.proposedStartsAt && b.proposedEndsAt ? formatWhenFor(b.proposedStartsAt, b.proposedEndsAt, tz) : when;
      const url = this.requesterUrl(b);
      const visitor = b.requesterType === 'VISITOR';
      const viewLabel = visitor ? 'View your request' : 'View your sessions';

      type Copy = { subject: string; heading: string; paragraphs: string[]; details: [string, string][]; push: string | null; cta?: string };
      const all: Record<RequesterEvent, Copy> = {
        VERIFY: {
          subject: `Confirm your request to meet ${pastors}`,
          heading: 'One more step',
          paragraphs: [
            `Thank you for reaching out. Please confirm your email so your request can reach ${pastors}.`,
            'The time is held for you for 30 minutes. If you didn’t ask for this, you can ignore this email.',
          ],
          details: [['When', when]],
          push: null,
          cta: 'Confirm my request',
        },
        RECEIVED: {
          subject: `Your request to meet ${pastors}`,
          heading: 'Request sent',
          paragraphs: [
            `Your request to meet ${pastors} has been sent, and the time is held for you.`,
            visitor
              ? 'We’ll email you as soon as there’s an answer. Keep this email: its link lets you see, change or withdraw your request.'
              : 'We’ll let you know as soon as it’s approved.',
          ],
          details: [['When', when]],
          push: null,
        },
        APPROVED: {
          subject: `Approved: your session with ${pastors}`,
          heading: 'Your session is approved',
          paragraphs: [`${Pastors} will see you then. We’ll remind you the day before and an hour before.`],
          details: [['When', when], ...(b.meetLink ? ([['Meet link', b.meetLink]] as [string, string][]) : [])],
          push: `${Pastors} approved your session on ${when}.`,
        },
        PROPOSED: {
          subject: `${Pastors} suggested a different time`,
          heading: 'A different time',
          paragraphs: [`${Pastors} can’t make the time you asked for and suggested another. Accept it, or pick a different time.`],
          details: [
            ['Suggested', proposedWhen],
            ['You asked for', when],
          ],
          push: `${Pastors} suggested ${proposedWhen}.`,
          cta: 'Answer',
        },
        DECLINED: {
          subject: `About your request to meet ${pastors}`,
          heading: 'Request not approved',
          paragraphs: [`${Pastors} isn’t able to take this session. You’re welcome to request another time.`],
          details: [['You asked for', when]],
          push: `${Pastors} couldn’t take your session on ${when}.`,
        },
        CANCELLED_BY_HOST: {
          subject: `Your session with ${pastors} has been cancelled`,
          heading: 'Session cancelled',
          paragraphs: [`Your session with ${pastors} has had to be cancelled. You’re welcome to request another time.`],
          details: [['Was', when]],
          push: `Your session on ${when} has been cancelled.`,
        },
        LAPSED: {
          subject: `About your request to meet ${pastors}`,
          heading: 'No answer in time',
          paragraphs: [
            `We’re sorry: your request couldn’t be answered before the time you picked, so it has been released.`,
            'Please pick another time. We’d still love for you to meet.',
          ],
          details: [['You asked for', when]],
          push: `Your request for ${when} couldn’t be answered in time. Please pick another time.`,
          cta: visitor ? 'Pick another time' : undefined,
        },
        LINK_UPDATED: {
          subject: `Meeting link for your session with ${pastors}`,
          heading: 'Your meeting link',
          paragraphs: [`Here’s the link to join your session with ${pastors}. Open it a few minutes before the start.`],
          details: [['When', when], ...(b.meetLink ? ([['Join', b.meetLink]] as [string, string][]) : [])],
          push: `Meeting link added for your session on ${when}.`,
        },
        REMINDER_DAY: {
          subject: `Tomorrow: your session with ${pastors}`,
          heading: 'See you tomorrow',
          paragraphs: [`A reminder of your session with ${pastors}.`],
          details: [['When', when], ...(b.meetLink ? ([['Meet link', b.meetLink]] as [string, string][]) : [])],
          push: `Tomorrow: your session with ${pastors}, ${when}.`,
        },
        REMINDER_HOUR: {
          subject: `In an hour: your session with ${pastors}`,
          heading: 'Starting in an hour',
          paragraphs: [`Your session with ${pastors} starts in about an hour.`],
          details: [['When', when], ...(b.meetLink ? ([['Meet link', b.meetLink]] as [string, string][]) : [])],
          push: `Your session with ${pastors} starts in an hour.`,
        },
      };
      const copy = all[event];

      const href = event === 'LAPSED' && visitor ? `${this.links.siteUrl}/talk-to-a-pastor` : url;
      this.events.emit(
        NotificationEvents.SendEmail,
        buildPastoralSessionEmail({
          to: b.requesterEmail,
          name: firstName(b.requesterName),
          subject: copy.subject,
          heading: copy.heading,
          paragraphs: copy.paragraphs,
          details: [['With', Pastors], ['Session', b.typeName], ...copy.details, ['How', FORMAT_LABEL[b.format]]],
          quote: note ? { label: `A note from ${pastors}`, text: note } : null,
          cta: { label: copy.cta ?? viewLabel, href },
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
