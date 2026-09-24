"use client";

import { useEffect, useRef, useState } from "react";
import {
  useFollowUpNoteActions,
  useFollowUpNotes,
  type FollowUpNote,
  type MasterListRow,
} from "@/lib/api/follow-up-pipeline";
import { ConfirmDeleteMessage } from "./ConfirmDeleteMessage";
import { ThreadMessages } from "./ThreadMessages";
import { ThreadSkeleton } from "./table-states";
import { ThreadComposer } from "./ThreadComposer";
import { ThreadEmptyState } from "./ThreadEmptyState";
import { buildThread } from "./thread-utils";

/**
 * What the team has said about this person, laid out as a conversation: a
 * divider each day, runs of messages from one person shown once with their
 * name, and a composer pinned underneath.
 */
export function ActivityThread({ person }: { person: MasterListRow }) {
  const subject = { kind: person.kind, id: person.id };
  const { data: notes = [], isLoading } = useFollowUpNotes(subject);
  const { add, react, edit, remove } = useFollowUpNoteActions(subject);
  const [deleting, setDeleting] = useState<FollowUpNote | null>(null);
  const [prefill, setPrefill] = useState<{ text: string; nonce: number } | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  // Sending is optimistic, so it never blocks the box; the rest are brief.
  const busy = edit.isPending || remove.isPending;
  const items = buildThread(notes);

  // Stay at the newest message, as a chat does.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [notes.length]);

  return (
    <section className="flex min-h-[70vh] flex-col pt-4">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold text-[#111] dark:text-white">Activity</h3>
        {notes.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-white/10 dark:text-white/50">
            {notes.length}
          </span>
        )}
      </div>

      <div className="-mx-4 mt-2 flex-1 overflow-y-auto border-y border-gray-100 py-2 no-scrollbar dark:border-white/[0.06]">
        {isLoading && <ThreadSkeleton />}

        {!isLoading && notes.length === 0 && (
          <ThreadEmptyState
            firstName={person.name.split(" ")[0]}
            onStart={(text) => setPrefill({ text, nonce: Date.now() })}
          />
        )}

        <ThreadMessages
          items={items}
          busy={busy}
          onEdit={(id, body) => edit.mutate({ id, body })}
          onDelete={setDeleting}
          onReact={(id, emoji) => react.mutate({ id, emoji })}
          onReply={(parentId, body) => add.mutate({ body, parentId })}
        />
        <div ref={endRef} />
      </div>

      <ThreadComposer
        firstName={person.name.split(" ")[0]}
        busy={busy}
        prefill={prefill}
        onSend={(body, done) => {
          add.mutate({ body });
          done();
        }}
      />

      <ConfirmDeleteMessage
        note={deleting}
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
