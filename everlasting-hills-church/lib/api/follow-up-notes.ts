"use client";

import { useQuery } from "@tanstack/react-query";
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
export function useFollowUpNotes(subject: { kind: string; id: string } | null) {
  return useQuery({
    queryKey: notesKey(subject?.kind ?? "", subject?.id ?? ""),
    queryFn: () => api.get<FollowUpNote[]>(`/follow-up/notes/${subject?.kind}/${subject?.id}`),
    enabled: !!subject,
    refetchInterval: (query) => (query.state.data?.some(isPending) ? false : POLL_MS),
    refetchOnWindowFocus: true,
  });
}

export { useFollowUpNoteActions } from "./follow-up-note-actions";
