import type { FollowUpNote } from "@/lib/api/follow-up-pipeline";

/** Messages from the same person within this long are shown as one run. */
const RUN_WINDOW_MS = 5 * 60 * 1000;

export type ThreadItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "milestone"; key: string; status: "INTEGRATED" | "OPTED_OUT"; at: string }
  | { kind: "message"; key: string; note: FollowUpNote; compact: boolean };

/** "Today", "Yesterday", or "Monday, 21 September". */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Lays the thread out the way a chat reads: a divider whenever the day
 * changes, and consecutive messages from one person within a few minutes
 * shown as a run — only the first carries their photo and name, so a burst of
 * three messages doesn't repeat someone's face three times.
 */
export function buildThread(
  notes: FollowUpNote[],
  milestones: { status: "INTEGRATED" | "OPTED_OUT"; at: string }[] = [],
): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDay = "";
  let previous: FollowUpNote | null = null;
  // Where someone was integrated or opted out, a marker sits in the thread at
  // that moment: everything above is what came before, and the conversation
  // below is the new one. Past activity stays, above the line.
  const pending = [...milestones].sort((a, b) => a.at.localeCompare(b.at));
  const placeMilestonesBefore = (at: number) => {
    while (pending.length && new Date(pending[0].at).getTime() <= at) {
      const m = pending.shift()!;
      items.push({ kind: "milestone", key: `milestone-${m.status}-${m.at}`, status: m.status, at: m.at });
      previous = null; // a new conversation: nobody's run carries across the line
    }
  };

  for (const note of notes) {
    placeMilestonesBefore(new Date(note.createdAt).getTime());
    const day = new Date(note.createdAt).toDateString();
    const newDay = day !== lastDay;
    if (newDay) {
      items.push({ kind: "day", key: `day-${day}`, label: dayLabel(note.createdAt) });
      lastDay = day;
    }

    const sameAuthor = previous?.author.profileId === note.author.profileId;
    const closeInTime =
      !!previous && new Date(note.createdAt).getTime() - new Date(previous.createdAt).getTime() < RUN_WINDOW_MS;

    items.push({ kind: "message", key: note.id, note, compact: !newDay && sameAuthor && closeInTime });
    previous = note;
  }
  placeMilestonesBefore(Number.POSITIVE_INFINITY);

  return items;
}
