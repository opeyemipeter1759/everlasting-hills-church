import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildFollowUpMessageEmail } from '../../notifications/templates/follow-up-message.email';
import type { Env } from '../../config/env.validation';
import { findFollowUpUnit, findIntegrationUnit } from '../follow-up-unit.util';
import { FollowUpPersonService } from './follow-up-person.service';

/** One alert per person per thread while they still have one unread: a busy chat is one email, not twenty. */
export const ALERT_QUIET_MS = 30 * 60_000;
export const ALERT_TYPE = 'follow-up-message';

/**
 * Tells people about new activity on a follow-up thread: the person's
 * assignee, and everyone else who has posted on it — Follow Up and Integration
 * alike, since both boards share the thread. Never the author. Each gets a
 * bell notification and, if they have an email address, an email.
 *
 * If someone already has an unread alert about the same person from the last
 * half hour, they aren't sent another: the one waiting already says there's
 * something new.
 */
@Injectable()
export class FollowUpNoteAlertsService {
  private readonly logger = new Logger(FollowUpNoteAlertsService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly people: FollowUpPersonService,
    private readonly inbox: InboxService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  /** Fire-and-forget from the caller's side: never throws. */
  async onNewMessage(authorProfileId: string, subjectKind: string, subjectId: string, body: string): Promise<void> {
    try {
      await this.send(authorProfileId, subjectKind, subjectId, body);
    } catch (err) {
      this.logger.error(`Couldn't send new-activity alerts for ${subjectKind}:${subjectId}: ${(err as Error).message}`);
    }
  }

  private async send(authorProfileId: string, subjectKind: string, subjectId: string, body: string) {
    const person = await this.people.get(subjectKind, subjectId);

    // Who to tell: the assignee, plus everyone who has posted on this thread.
    // Both teams' assignees: Follow Up's and, once integrated, the Integration Team's.
    const assigneeIds = [person.assignedTo?.id, person.integrationAssignedTo?.id].filter((id): id is string => !!id);
    const [assignees, posters, author] = await Promise.all([
      assigneeIds.length
        ? this.prisma.member.findMany({ where: { id: { in: assigneeIds } }, select: { profileId: true } })
        : [],
      this.prisma.followUpNote.findMany({
        where: { tenantId: this.tenantId, subjectKind, subjectId },
        select: { authorId: true },
        distinct: ['authorId'],
      }),
      this.prisma.member.findFirst({ where: { profileId: authorProfileId }, select: { firstName: true, lastName: true } }),
    ]);
    const reasons = new Map<string, 'assignee' | 'participant'>();
    for (const p of posters) reasons.set(p.authorId, 'participant');
    for (const a of assignees) if (a.profileId) reasons.set(a.profileId, 'assignee');
    reasons.delete(authorProfileId);
    if (reasons.size === 0) return;

    const url = await this.boardUrl(person.status);
    // The thread is part of the link, so the quiet period is per person-thread.
    const link = `${url}?thread=${encodeURIComponent(`${subjectKind}:${subjectId}`)}`;
    const since = new Date(Date.now() - ALERT_QUIET_MS);
    const alreadyWaiting = await this.prisma.notification.findMany({
      where: {
        tenantId: this.tenantId,
        profileId: { in: [...reasons.keys()] },
        type: ALERT_TYPE,
        link,
        readAt: null,
        createdAt: { gte: since },
      },
      select: { profileId: true },
    });
    for (const n of alreadyWaiting) reasons.delete(n.profileId);
    if (reasons.size === 0) return;

    const recipients = await this.prisma.member.findMany({
      where: { profileId: { in: [...reasons.keys()] } },
      select: { profileId: true, firstName: true, email: true },
    });
    const authorName = author ? `${author.firstName} ${author.lastName}`.trim() : 'A team member';
    const snippet = body.length > 140 ? `${body.slice(0, 140).trimEnd()}…` : body;

    await this.inbox.createMany(
      [...reasons.keys()].map((profileId) => ({
        tenantId: this.tenantId,
        profileId,
        title: `New activity on ${person.name}`,
        body: `${authorName}: ${snippet}`,
        type: ALERT_TYPE,
        link,
      })),
    );

    for (const r of recipients) {
      if (!r.email) continue;
      this.events.emit(
        NotificationEvents.SendEmail,
        buildFollowUpMessageEmail({
          to: r.email,
          recipientFirstName: r.firstName,
          authorName,
          subjectName: person.name,
          message: body,
          reason: reasons.get(r.profileId) ?? 'participant',
          url: `${this.appUrl}${link}`,
        }),
      );
    }
  }

  /**
   * The board this person is on: Integration once they're integrated, Follow
   * Up otherwise — the same line the two boards' lists draw.
   */
  private async boardUrl(status: string): Promise<string> {
    const unit =
      status === 'INTEGRATED'
        ? ((await findIntegrationUnit(this.prisma, this.tenantId)) ?? (await findFollowUpUnit(this.prisma, this.tenantId)))
        : await findFollowUpUnit(this.prisma, this.tenantId);
    return unit ? `/dashboard/membership-assimilation/${unit.id}` : '/dashboard';
  }
}
