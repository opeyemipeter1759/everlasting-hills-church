"use client";

import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import { ReactionBar } from "./ReactionBar";
import { ReplyThread } from "./ReplyThread";

/** Under the message: the emoji on it, then its replies. */
export function MessageFooter({
  note,
  busy,
  onReact,
  onReply,
}: {
  note: FollowUpNote;
  busy: boolean;
  onReact: (id: string, emoji: string) => void;
  onReply: (parentId: string, body: string) => void;
}) {
  return (
    <>
      <ReactionBar reactions={note.reactions} busy={busy} onToggle={(emoji) => onReact(note.id, emoji)} />
      <ReplyThread replies={note.replies} busy={busy} onReply={(body) => onReply(note.id, body)} />
    </>
  );
}
