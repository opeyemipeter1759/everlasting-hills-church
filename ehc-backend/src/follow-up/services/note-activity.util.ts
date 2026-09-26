/** One person's thread, as the Master List shows it. */
export interface ThreadActivity {
  /** Messages and replies logged so far. */
  total: number;
  /** Posted by someone else since the viewer last opened the thread. */
  unread: number;
}

export const threadKey = (subjectKind: string, subjectId: string) => `${subjectKind}:${subjectId}`;

/**
 * How many messages each thread has, and how many the viewer hasn't seen. A
 * message is unread when someone else posted it after the viewer last opened
 * that thread — or at all, if they never have. Your own messages never count.
 */
export function summariseActivity(
  notes: { subjectKind: string; subjectId: string; authorId: string; createdAt: Date }[],
  reads: { subjectKind: string; subjectId: string; lastReadAt: Date }[],
  viewerProfileId: string | null,
): Map<string, ThreadActivity> {
  const lastRead = new Map(reads.map((r) => [threadKey(r.subjectKind, r.subjectId), r.lastReadAt.getTime()]));
  const activity = new Map<string, ThreadActivity>();
  for (const note of notes) {
    const key = threadKey(note.subjectKind, note.subjectId);
    const counts = activity.get(key) ?? { total: 0, unread: 0 };
    counts.total += 1;
    const seenUpTo = lastRead.get(key);
    if (note.authorId !== viewerProfileId && (seenUpTo === undefined || note.createdAt.getTime() > seenUpTo)) {
      counts.unread += 1;
    }
    activity.set(key, counts);
  }
  return activity;
}
