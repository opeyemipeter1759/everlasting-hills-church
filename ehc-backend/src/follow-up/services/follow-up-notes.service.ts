import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { FollowUpStatusService } from './follow-up-status.service';
import type { MapContext, MappedNote } from './note-mapper.util';
import { assembleThread, createNote, profileIdsIn, toggleReaction } from './note-thread.util';

export type FollowUpNote = MappedNote;

/**
 * The team's conversation about one person: messages, the replies under them,
 * and who reacted with what. Anyone on the team may post, reply and react, and
 * edit or delete their own messages; the Follow Up lead or head of department
 * may delete anyone's, since a thread about a real person occasionally needs
 * something taken down without waiting for its author.
 */
@Injectable()
export class FollowUpNotesService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: FollowUpStatusService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(actor: AuthUser, subjectKind: string, subjectId: string): Promise<FollowUpNote[]> {
    const rows = await this.prisma.followUpNote.findMany({
      where: { tenantId: this.tenantId, subjectKind, subjectId },
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
      viewerProfileId: actor.profileId,
      canModerate: await this.status.canDecide(actor),
    };
    return assembleThread(rows, ctx);
  }

  async add(actor: AuthUser, subjectKind: string, subjectId: string, body: string, parentId?: string) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    await createNote(this.prisma, {
      tenantId: this.tenantId,
      subjectKind,
      subjectId,
      authorId: actor.profileId,
      body,
      parentId,
    });
    return this.list(actor, subjectKind, subjectId);
  }

  /** A reaction on a message; reacting again with the same emoji takes it back. */
  async react(actor: AuthUser, noteId: string, emoji: string) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    const note = await this.prisma.followUpNote.findFirst({ where: { id: noteId, tenantId: this.tenantId } });
    if (!note) throw new NotFoundException('Message not found');

    await toggleReaction(this.prisma, {
      tenantId: this.tenantId,
      noteId,
      profileId: actor.profileId,
      emoji,
    });
    return this.list(actor, note.subjectKind, note.subjectId);
  }

  async edit(actor: AuthUser, id: string, body: string) {
    const note = await this.mine(actor, id, 'edit');
    await this.prisma.followUpNote.update({ where: { id }, data: { body: body.trim(), editedAt: new Date() } });
    return this.list(actor, note.subjectKind, note.subjectId);
  }

  async remove(actor: AuthUser, id: string) {
    const note = await this.mine(actor, id, 'delete');
    // Replies and reactions go with it — the schema cascades both.
    await this.prisma.followUpNote.delete({ where: { id } });
    return this.list(actor, note.subjectKind, note.subjectId);
  }

  private async mine(actor: AuthUser, id: string, action: 'edit' | 'delete') {
    const note = await this.prisma.followUpNote.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!note) throw new NotFoundException('Message not found');
    if (note.authorId === actor.profileId) return note;
    if (action === 'delete' && (await this.status.canDecide(actor))) return note;
    throw new ForbiddenException(`You can only ${action} your own messages`);
  }
}
