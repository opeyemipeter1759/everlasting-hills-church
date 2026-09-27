"use client";

import { useEffect, useRef, useState } from "react";
import { useFollowUpNoteActions, useFollowUpNotes, type FollowUpNote } from "@/lib/api/follow-up-pipeline";
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
export function ActivityThread({
  person,
  milestones = [],
  title = "Activity",
  notesBase,
  listKey,
}: {
  person: { kind: string; id: string; name: string };
  /** When they were integrated or opted out, to mark in the thread. */
  milestones?: { status: "INTEGRATED" | "OPTED_OUT"; at: string }[];
  /** Another board reusing the thread (Evangelism) names it and points it at its own notes. */
  title?: string;
  notesBase?: string;
  listKey?: readonly unknown[];
}) {
  const subject = { kind: person.kind, id: person.id };
  const { data: notes = [], isLoading } = useFollowUpNotes(subject, { base: notesBase, listKey });
  const { add, react, edit, remove } = useFollowUpNoteActions(subject, notesBase);
  const [deleting, setDeleting] = useState<FollowUpNote | null>(null);
  const [prefill, setPrefill] = useState<{ text: string; nonce: number } | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  // Sending is optimistic, so it never blocks the box; the rest are brief.
  const busy = edit.isPending || remove.isPending;
  const items = buildThread(notes, milestones);

  // Stay at the newest message, as a chat does.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [notes.length]);

  return (
    <section className="flex flex-col pt-4">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold text-[#111] dark:text-white">{title}</h3>
        {notes.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-white/10 dark:text-white/50">
            {notes.length}
          </span>
        )}
      </div>

      {/* Its own scroll, with a visible bar: the whole history — including
          everything from before they were integrated — is there to scroll back
          through, while the box to reply stays in view. Opens at the newest. */}
      <div
        tabIndex={0}
        aria-label={`${title} with ${person.name}`}
        className="-mx-4 mt-2 max-h-[60vh] min-h-[16rem] overflow-y-auto overscroll-contain border-y border-gray-100 py-2 [scrollbar-color:#d1d5db_transparent] [scrollbar-width:thin] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 dark:border-white/[0.06]"
      >
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
