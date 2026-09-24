"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { showToast } from "@/components/ui/toast/toast";
import { useMe } from "@/lib/api";
import type { FollowUpNote } from "./follow-up-pipeline";
import { applyReaction, draftNote, replaceNote, withoutNote } from "./follow-up-notes.util";

function notesKey(kind: string, id: string) {
  return ["follow-up", "notes", kind, id];
}

/**
 * Posting, replying, reacting, editing and deleting — all applied to the
 * thread on screen the instant you act, then reconciled with whatever the
 * server returns.
 *
 * Waiting on a round trip before showing your own message makes a chat feel
 * broken, so the change goes in first and is put back if the server refuses.
 */
export function useFollowUpNoteActions(subject: { kind: string; id: string } | null) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const key = notesKey(subject?.kind ?? "", subject?.id ?? "");

  const settle = (notes: FollowUpNote[]) => queryClient.setQueryData(key, notes);
  const current = () => queryClient.getQueryData<FollowUpNote[]>(key) ?? [];

  /** Holds the thread still, keeps a copy to restore, and returns it. */
  async function begin(change: (notes: FollowUpNote[]) => FollowUpNote[]) {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = current();
    queryClient.setQueryData(key, change(previous));
    return { previous };
  }

  function undo(context: { previous: FollowUpNote[] } | undefined, err: unknown, fallback: string) {
    if (context) queryClient.setQueryData(key, context.previous);
    const message = (err as { message?: string })?.message;
    showToast.error(message && message.length < 120 ? message : fallback);
  }

  const add = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string }) =>
      api.post<FollowUpNote[]>(`/follow-up/notes/${subject?.kind}/${subject?.id}`, { body, parentId }),
    onMutate: ({ body, parentId }) => {
      const mine = draftNote(body, me);
      return begin((notes) =>
        parentId
          ? replaceNote(notes, parentId, (note) => ({ ...note, replies: [...note.replies, mine] }))
          : [...notes, mine],
      );
    },
    onSuccess: settle,
    onError: (err, _vars, context) => undo(context, err, "Couldn't post that message"),
  });

  const react = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      api.post<FollowUpNote[]>(`/follow-up/notes/${id}/reactions`, { emoji }),
    onMutate: ({ id, emoji }) =>
      begin((notes) => replaceNote(notes, id, (note) => applyReaction(note, emoji, me))),
    onSuccess: settle,
    onError: (err, _vars, context) => undo(context, err, "Couldn't add that reaction"),
  });

  const edit = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.patch<FollowUpNote[]>(`/follow-up/notes/${id}`, { body }),
    onMutate: ({ id, body }) =>
      begin((notes) => replaceNote(notes, id, (note) => ({ ...note, body, editedAt: new Date().toISOString() }))),
    onSuccess: settle,
    onError: (err, _vars, context) => undo(context, err, "Couldn't save that edit"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<FollowUpNote[]>(`/follow-up/notes/${id}`),
    onMutate: (id) => begin((notes) => withoutNote(notes, id)),
    onSuccess: settle,
    onError: (err, _vars, context) => undo(context, err, "Couldn't delete that message"),
  });

  return { add, react, edit, remove };
}
