import type { MeResponse } from "@/lib/api";
import type { FollowUpNote } from "./follow-up-pipeline";

/** Marks a message that exists on screen but not yet on the server. */
export const PENDING_PREFIX = "pending-";

export function isPending(note: FollowUpNote): boolean {
  return note.id.startsWith(PENDING_PREFIX);
}

function viewer(me: MeResponse | undefined) {
  const member = me?.member;
  return {
    profileId: me?.profileId ?? "me",
    name: member ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "You" : "You",
    photoUrl: member?.photoUrl ?? null,
  };
}

/** The message shown straight away, before the server has confirmed it. */
export function draftNote(body: string, me: MeResponse | undefined): FollowUpNote {
  return {
    id: `${PENDING_PREFIX}${Date.now()}`,
    body,
    createdAt: new Date().toISOString(),
    editedAt: null,
    author: viewer(me),
    reactions: [],
    replies: [],
    canEdit: false,
    canDelete: false,
  };
}

/** Applies `change` to one message, wherever it sits — top level or a reply. */
export function replaceNote(
  notes: FollowUpNote[],
  id: string,
  change: (note: FollowUpNote) => FollowUpNote,
): FollowUpNote[] {
  return notes.map((note) =>
    note.id === id ? change(note) : { ...note, replies: replaceNote(note.replies, id, change) },
  );
}

/** Removes one message, and its replies with it. */
export function withoutNote(notes: FollowUpNote[], id: string): FollowUpNote[] {
  return notes
    .filter((note) => note.id !== id)
    .map((note) => ({ ...note, replies: withoutNote(note.replies, id) }));
}

/** Adds your emoji, or takes it back when it is already yours. */
export function applyReaction(note: FollowUpNote, emoji: string, me: MeResponse | undefined): FollowUpNote {
  const you = viewer(me);
  const existing = note.reactions.find((reaction) => reaction.emoji === emoji);

  if (!existing) {
    return { ...note, reactions: [...note.reactions, { emoji, count: 1, mine: true, names: [you.name] }] };
  }

  const reactions = note.reactions
    .map((reaction) => {
      if (reaction.emoji !== emoji) return reaction;
      return reaction.mine
        ? {
            ...reaction,
            count: reaction.count - 1,
            mine: false,
            names: reaction.names.filter((name) => name !== you.name),
          }
        : { ...reaction, count: reaction.count + 1, mine: true, names: [...reaction.names, you.name] };
    })
    .filter((reaction) => reaction.count > 0);

  return { ...note, reactions };
}
