"use client";

import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import { ThreadMessage } from "./ThreadMessage";
import { DayDivider } from "./message-bits";
import type { ThreadItem } from "./thread-utils";

/** The messages themselves: a divider each day, then each message in order. */
export function ThreadMessages({
  items,
  busy,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: {
  items: ThreadItem[];
  busy: boolean;
  onEdit: (id: string, body: string) => void;
  onDelete: (note: FollowUpNote) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (parentId: string, body: string) => void;
}) {
  return (
    <ul>
      {items.map((item) =>
        item.kind === "day" ? (
          <DayDivider key={item.key} label={item.label} />
        ) : (
          <ThreadMessage
            key={item.key}
            note={item.note}
            compact={item.compact}
            busy={busy}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
            onReply={onReply}
          />
        ),
      )}
    </ul>
  );
}
