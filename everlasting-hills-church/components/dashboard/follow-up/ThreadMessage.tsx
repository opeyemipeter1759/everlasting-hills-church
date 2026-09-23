"use client";

import { useState } from "react";
import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";
import { NoteEditor } from "./NoteEditor";
import { Avatar, HoverTime } from "./message-bits";
import { MessageActions } from "./MessageActions";
import { fullTimestamp, timeLabel } from "./thread-utils";
import { MessageBody } from "./message-format";
import { isPending } from "@/lib/api/follow-up-notes.util";
import { MessageFooter } from "./MessageFooter";

/**
 * One message. The first of a run carries the photo, name and time; the rest
 * sit under it in the same column, showing their time only on hover — which
 * is what keeps a burst of messages reading as one person talking.
 */
export function ThreadMessage({
  note,
  compact,
  busy,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: {
  note: FollowUpNote;
  compact: boolean;
  busy: boolean;
  onEdit: (id: string, body: string) => void;
  onDelete: (note: FollowUpNote) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (parentId: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const sending = isPending(note);

  return (
    <li
      className={`group relative px-5 transition-opacity hover:bg-[#F8F8F8] dark:hover:bg-white/[0.04] ${sending ? "opacity-60" : ""} ${
        compact ? "py-[3px]" : "mt-2.5 py-1 first:mt-0"
      }`}
    >
      {/* Who and when on one line, what they said on the next. */}
      {!compact && (
        <div className="flex items-center gap-2">
          <Avatar name={note.author.name} photoUrl={note.author.photoUrl} size={28} />
          <span className="text-[15px] font-black leading-tight text-[#1D1C1D] dark:text-white">
            {note.author.name}
          </span>
          <span title={fullTimestamp(note.createdAt)} className="text-xs text-[#616061] dark:text-white/40">
            {timeLabel(note.createdAt)}
          </span>
        </div>
      )}

      {/* Indented to sit under the name, not the avatar. */}
      <div className="min-w-0 pl-9">
        {compact && <HoverTime iso={note.createdAt} />}

        {editing ? (
          <NoteEditor
            initial={note.body}
            busy={busy}
            onCancel={() => setEditing(false)}
            onSave={(body) => {
              onEdit(note.id, body);
              setEditing(false);
            }}
          />
        ) : (
          <div className="break-words text-[15px] leading-[1.46667] text-[#1D1C1D] dark:text-white/85">
            <MessageBody body={note.body} />
            {note.editedAt && <span className="ml-1 text-[11px] text-gray-400 dark:text-white/30">(edited)</span>}
          </div>
        )}

        {!editing && !sending && (
          <MessageFooter note={note} busy={busy} onReact={onReact} onReply={onReply} />
        )}
      </div>

      {!editing && !sending && (
        <MessageActions
          canEdit={note.canEdit}
          canDelete={note.canDelete}
          onEdit={() => setEditing(true)}
          onDelete={() => onDelete(note)}
        />
      )}
    </li>
  );
}
