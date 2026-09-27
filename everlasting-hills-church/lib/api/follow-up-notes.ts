"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { FollowUpNote } from "./follow-up-pipeline";
import { isPending } from "./follow-up-notes.util";

function notesKey(kind: string, id: string) {
  return ["follow-up", "notes", kind, id];
}

/** How often an open thread asks the server for anything new. */
const POLL_MS = 60_000;

/**
 * The thread, kept current: it re-reads every minute while open, and again
 * whenever the window is brought back, so a message someone else posts turns
 * up without anyone reloading.
 *
 * Polling pauses while a message of your own is still being sent — a refetch
 * landing mid-send would take your message off the screen for a moment and
 * then put it back. It also stops while the tab is in the background, which
 * is React Query's default and exactly what we want on a phone.
 */
export function useFollowUpNotes(
  subject: { kind: string; id: string } | null,
  /** Where the thread lives, and which list's unread badges to refresh — Follow Up's unless another board reuses the thread. */
  { base = "/follow-up/notes", listKey = ["follow-up", "master-list"] }: { base?: string; listKey?: readonly unknown[] } = {},
) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: notesKey(subject?.kind ?? "", subject?.id ?? ""),
    queryFn: () => api.get<FollowUpNote[]>(`${base}/${subject?.kind}/${subject?.id}`),
    enabled: !!subject,
    refetchInterval: (query) => (query.state.data?.some(isPending) ? false : POLL_MS),
    refetchOnWindowFocus: true,
  });

  // Reading the thread marks it read on the server, so the Master List's
  // unread badge for this person is now out of date: fetch it again. Keyed on
  // the message count, not every poll, so an open thread doesn't reload the
  // list each minute when nothing has changed.
  const count = query.data?.length;
  useEffect(() => {
    if (count === undefined) return;
    void qc.invalidateQueries({ queryKey: listKey });
    // listKey is a fresh array each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, subject?.kind, subject?.id, count, JSON.stringify(listKey)]);

  return query;
}

export { useFollowUpNoteActions } from "./follow-up-note-actions";
