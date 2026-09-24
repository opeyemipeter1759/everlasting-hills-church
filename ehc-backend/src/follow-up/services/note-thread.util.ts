import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PrismaService } from '../../prisma/prisma.service';
import { mapNote, type MapContext, type MappedNote, type NoteRow as Row } from './note-mapper.util';

/** Everyone who needs a name and a face: authors and anyone who reacted. */
export function profileIdsIn(rows: Row[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    ids.add(row.authorId);
    for (const reaction of row.Reactions) ids.add(reaction.profileId);
  }
  return [...ids];
}

/** Replies hang off their parent rather than appearing in the main run. */
export function assembleThread(rows: Row[], ctx: MapContext): MappedNote[] {
  const repliesByParent = new Map<string, MappedNote[]>();
  for (const row of rows.filter((r) => r.parentId)) {
    const parentId = row.parentId as string;
    repliesByParent.set(parentId, [...(repliesByParent.get(parentId) ?? []), mapNote(row, ctx)]);
  }
  return rows.filter((r) => !r.parentId).map((row) => mapNote(row, ctx, repliesByParent.get(row.id) ?? []));
}

/** Same emoji twice takes it back — one row per person per emoji. */
export async function toggleReaction(
  prisma: PrismaService,
  args: { tenantId: string; noteId: string; profileId: string; emoji: string },
): Promise<void> {
  const { tenantId, noteId, profileId, emoji } = args;
  const existing = await prisma.followUpNoteReaction.findFirst({ where: { noteId, profileId, emoji } });
  if (existing) {
    await prisma.followUpNoteReaction.delete({ where: { id: existing.id } });
    return;
  }
  await prisma.followUpNoteReaction.create({
    data: { id: randomUUID(), tenantId, noteId, profileId, emoji },
  });
}

/** Post a message, or a reply under one that must still exist. */
export async function createNote(
  prisma: PrismaService,
  args: { tenantId: string; subjectKind: string; subjectId: string; authorId: string; body: string; parentId?: string },
): Promise<void> {
  const { tenantId, parentId } = args;
  if (parentId) {
    const parent = await prisma.followUpNote.findFirst({ where: { id: parentId, tenantId } });
    if (!parent) throw new NotFoundException('The message being replied to no longer exists');
  }
  await prisma.followUpNote.create({
    data: { ...args, id: randomUUID(), body: args.body.trim(), parentId: parentId ?? null },
  });
}
