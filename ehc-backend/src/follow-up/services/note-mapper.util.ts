import { personName } from './master-list.util';

export interface NoteAuthor {
  profileId: string;
  name: string;
  photoUrl: string | null;
}

export interface NoteReaction {
  emoji: string;
  count: number;
  /** True when the person reading it is one of them. */
  mine: boolean;
  /** Who reacted, for the tooltip. */
  names: string[];
}

export interface MappedNote {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: NoteAuthor;
  reactions: NoteReaction[];
  replies: MappedNote[];
  canEdit: boolean;
  canDelete: boolean;
}

type AuthorRow = { profileId: string; firstName: string; lastName: string; photoUrl: string | null };
type ReactionRow = { emoji: string; profileId: string };
export type NoteRow = {
  id: string;
  body: string;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  Reactions: ReactionRow[];
};

export interface MapContext {
  authors: Map<string, AuthorRow>;
  viewerProfileId: string | null;
  canModerate: boolean;
}

function nameOf(ctx: MapContext, profileId: string): string {
  const author = ctx.authors.get(profileId);
  return author ? personName(author) : 'A team member';
}

/** Emoji grouped with who used them, newest emoji last — the order they first appeared. */
function reactionsOf(row: NoteRow, ctx: MapContext): NoteReaction[] {
  const grouped = new Map<string, ReactionRow[]>();
  for (const reaction of row.Reactions) {
    grouped.set(reaction.emoji, [...(grouped.get(reaction.emoji) ?? []), reaction]);
  }
  return [...grouped.entries()].map(([emoji, rows]) => ({
    emoji,
    count: rows.length,
    mine: rows.some((r) => r.profileId === ctx.viewerProfileId),
    names: rows.map((r) => nameOf(ctx, r.profileId)),
  }));
}

export function mapNote(row: NoteRow, ctx: MapContext, replies: MappedNote[] = []): MappedNote {
  const author = ctx.authors.get(row.authorId);
  const mine = row.authorId === ctx.viewerProfileId;

  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    author: {
      profileId: row.authorId,
      name: author ? personName(author) : 'A team member',
      photoUrl: author?.photoUrl ?? null,
    },
    reactions: reactionsOf(row, ctx),
    replies,
    canEdit: mine,
    canDelete: mine || ctx.canModerate,
  };
}
