import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildFollowUpMessageEmail } from '../../notifications/templates/follow-up-message.email';
import type { MapContext, MappedNote } from '../../follow-up/services/note-mapper.util';
import { assembleThread, createNote, profileIdsIn, toggleReaction } from '../../follow-up/services/note-thread.util';
import type { EvangelismViewer } from '../evangelism.types';
import { EvangelismAccessService } from './evangelism-access.service';
import { EVANGELISM_NOTE_KIND } from './evangelism-contacts.service';

/** One alert per person per thread while they still have one unread: a busy chat is one email, not twenty. */
const ALERT_QUIET_MS = 30 * 60_000;
const ALERT_TYPE = 'evangelism-feedback';

/**
 * The team's feedback on someone they preached to — the same conversation as
 * Follow Up's activity thread: messages, replies, reactions, edit and delete
 * your own. Stored in the same notes table under its own kind, so the two
 * never mix. Leaders may delete anyone's message.
 *
 * A new message tells the person following them up and everyone else who has
 * posted, never the author — in the app and by email, with a half-hour quiet
 * period per thread.
 */
@Injectable()
export class EvangelismNotesService {
  private readonly logger = new Logger(EvangelismNotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EvangelismAccessService,
    private readonly inbox: InboxService,
    private readonly events: EventEmitter2,
  ) {}

  private get tenantId() {
    return this.access.tenant;
  }

  private async contact(contactId: string) {
    const contact = await this.prisma.evangelismContact.findFirst({
      where: { id: contactId, tenantId: this.tenantId },
      select: { id: true, name: true, workerMemberId: true, assigneeMemberId: true },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async list(viewer: EvangelismViewer, contactId: string): Promise<MappedNote[]> {
    await this.contact(contactId);
    // Opening the thread reads all of it: nothing is unread for them any more.
    if (viewer.profileId) await this.markRead(viewer.profileId, contactId);
    const rows = await this.prisma.followUpNote.findMany({
      where: { tenantId: this.tenantId, subjectKind: EVANGELISM_NOTE_KIND, subjectId: contactId },
      orderBy: { createdAt: 'asc' },
      include: { Reactions: { select: { emoji: true, profileId: true } } },
    });
    if (rows.length === 0) return [];
    const authors = await this.prisma.member.findMany({
      where: { profileId: { in: profileIdsIn(rows) } },
      select: { profileId: true, firstName: true, lastName: true, photoUrl: true },
    });
    const ctx: MapContext = {
      authors: new Map(authors.map((a) => [a.profileId, a])),
      viewerProfileId: viewer.profileId,
      canModerate: viewer.canLead,
    };
    return assembleThread(rows, ctx);
  }

  async add(viewer: EvangelismViewer, contactId: string, body: string, parentId?: string) {
    if (!viewer.profileId) throw new ForbiddenException('No profile linked to this account');
    const contact = await this.contact(contactId);
    if (parentId) {
      const parent = await this.prisma.followUpNote.findFirst({
        where: { id: parentId, tenantId: this.tenantId, subjectKind: EVANGELISM_NOTE_KIND, subjectId: contactId },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('The message you are replying to is gone');
    }
    await createNote(this.prisma, {
      tenantId: this.tenantId,
      subjectKind: EVANGELISM_NOTE_KIND,
      subjectId: contactId,
      authorId: viewer.profileId,
      body,
      parentId,
    });
    // In the background: posting shouldn't wait on email.
    void this.alert(viewer, contact, body);
    return this.list(viewer, contactId);
  }

  async react(viewer: EvangelismViewer, noteId: string, emoji: string) {
    if (!viewer.profileId) throw new ForbiddenException('No profile linked to this account');
    const note = await this.note(noteId);
    await toggleReaction(this.prisma, { tenantId: this.tenantId, noteId, profileId: viewer.profileId, emoji });
    return this.list(viewer, note.subjectId);
  }

  async edit(viewer: EvangelismViewer, noteId: string, body: string) {
    const note = await this.note(noteId);
    if (note.authorId !== viewer.profileId) throw new ForbiddenException('You can only edit your own messages');
    await this.prisma.followUpNote.update({ where: { id: noteId }, data: { body: body.trim(), editedAt: new Date() } });
    return this.list(viewer, note.subjectId);
  }

  async remove(viewer: EvangelismViewer, noteId: string) {
    const note = await this.note(noteId);
    if (note.authorId !== viewer.profileId && !viewer.canLead) throw new ForbiddenException('You can only delete your own messages');
    // Replies and reactions go with it — the schema cascades both.
    await this.prisma.followUpNote.delete({ where: { id: noteId } });
    return this.list(viewer, note.subjectId);
  }

  /** Only evangelism feedback — Follow Up's own notes are never reachable from here. */
  private async note(noteId: string) {
    const note = await this.prisma.followUpNote.findFirst({
      where: { id: noteId, tenantId: this.tenantId, subjectKind: EVANGELISM_NOTE_KIND },
    });
    if (!note) throw new NotFoundException('Message not found');
    return note;
  }

  private async markRead(profileId: string, contactId: string) {
    const now = new Date();
    await this.prisma.followUpNoteRead.upsert({
      where: { profileId_subjectKind_subjectId: { profileId, subjectKind: EVANGELISM_NOTE_KIND, subjectId: contactId } },
      create: { id: randomUUID(), tenantId: this.tenantId, profileId, subjectKind: EVANGELISM_NOTE_KIND, subjectId: contactId, lastReadAt: now },
      update: { lastReadAt: now },
    });
  }

  /** Never throws: a failed alert must not fail the message. */
  private async alert(
    viewer: EvangelismViewer,
    contact: { id: string; name: string; workerMemberId: string | null; assigneeMemberId: string | null },
    body: string,
  ) {
    try {
      const responsibleId = contact.assigneeMemberId ?? contact.workerMemberId;
      const [responsible, posters] = await Promise.all([
        responsibleId ? this.prisma.member.findUnique({ where: { id: responsibleId }, select: { profileId: true } }) : null,
        this.prisma.followUpNote.findMany({
          where: { tenantId: this.tenantId, subjectKind: EVANGELISM_NOTE_KIND, subjectId: contact.id },
          select: { authorId: true },
          distinct: ['authorId'],
        }),
      ]);
      const reasons = new Map<string, 'assignee' | 'participant'>();
      for (const p of posters) reasons.set(p.authorId, 'participant');
      if (responsible?.profileId) reasons.set(responsible.profileId, 'assignee');
      if (viewer.profileId) reasons.delete(viewer.profileId);
      if (reasons.size === 0) return;

      const link = `/dashboard/growth-outreach/${viewer.unitId}?contact=${contact.id}`;
      const waiting = await this.prisma.notification.findMany({
        where: {
          tenantId: this.tenantId,
          profileId: { in: [...reasons.keys()] },
          type: ALERT_TYPE,
          link,
          readAt: null,
          createdAt: { gte: new Date(Date.now() - ALERT_QUIET_MS) },
        },
        select: { profileId: true },
      });
      for (const n of waiting) reasons.delete(n.profileId);
      if (reasons.size === 0) return;

      const snippet = body.length > 140 ? `${body.slice(0, 140).trimEnd()}…` : body;
      await this.inbox.createMany(
        [...reasons.keys()].map((profileId) => ({
          tenantId: this.tenantId,
          profileId,
          title: `New feedback on ${contact.name}`,
          body: `${viewer.name}: ${snippet}`,
          type: ALERT_TYPE,
          link,
        })),
      );
      const recipients = await this.prisma.member.findMany({
        where: { profileId: { in: [...reasons.keys()] } },
        select: { profileId: true, firstName: true, email: true },
      });
      for (const r of recipients) {
        if (!r.email) continue;
        this.events.emit(
          NotificationEvents.SendEmail,
          buildFollowUpMessageEmail({
            to: r.email,
            recipientFirstName: r.firstName,
            authorName: viewer.name,
            subjectName: contact.name,
            message: body,
            reason: reasons.get(r.profileId) ?? 'participant',
            url: `${this.access.appUrl}${link}`,
          }),
        );
      }
    } catch (err) {
      this.logger.error(`Couldn't send feedback alerts for ${contact.id}: ${(err as Error).message}`);
    }
  }
}
