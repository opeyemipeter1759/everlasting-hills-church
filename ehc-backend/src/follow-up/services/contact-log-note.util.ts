import type { FollowUpContactMethod, FollowUpContactOutcome, FollowUpLogKind } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

const METHOD: Record<FollowUpContactMethod, string> = {
  CALL: '📞 Call',
  SMS: '💬 SMS',
  WHATSAPP: '💬 WhatsApp',
  VISIT: '🏠 Visit',
  OTHER: '📋 Contact',
};

const OUTCOME: Record<FollowUpContactOutcome, string> = {
  REACHED: 'Reached',
  NO_ANSWER: 'No answer',
  VOICEMAIL: 'Voicemail',
  WRONG_NUMBER: 'Wrong number',
  SCHEDULED_VISIT: 'Visit scheduled',
};

/**
 * A logged contact as it reads in the person's activity thread: what was done
 * and how it went on the first line, the note under it. The one-off import of
 * past logs (migration 20260927100000) writes the same wording in SQL — keep
 * the two in step.
 */
export function contactLogBody(log: {
  kind: FollowUpLogKind;
  method: FollowUpContactMethod | null;
  outcome: FollowUpContactOutcome | null;
  note: string;
  isPastoralContact: boolean;
}): string {
  const note = log.note.trim();
  if (log.kind === 'CONNECTION') return `🤝 ${note}`;
  if (log.kind !== 'CONTACT') return note;
  const head = [
    log.method ? METHOD[log.method] : '📋 Contact',
    log.outcome ? OUTCOME[log.outcome] : null,
    log.isPastoralContact ? "Pastor's call" : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return note ? `${head}\n${note}` : head;
}

/** The thread a follow-up entry's activity belongs on: its member, or its first-timer. */
export function threadOf(entry: { memberId: string | null; visitorId: string | null }) {
  if (entry.memberId) return { subjectKind: 'MEMBER', subjectId: entry.memberId };
  if (entry.visitorId) return { subjectKind: 'VISITOR', subjectId: entry.visitorId };
  return null;
}

/**
 * Put a logged contact on the person's activity thread, so everything done for
 * them is in one conversation. The note's id is derived from the log's, so the
 * same log can never appear twice.
 */
export async function mirrorLogToThread(
  prisma: PrismaService,
  args: {
    tenantId: string;
    logId: string;
    entry: { memberId: string | null; visitorId: string | null };
    authorProfileId: string;
    body: string;
    at?: Date;
  },
): Promise<{ subjectKind: string; subjectId: string } | null> {
  const thread = threadOf(args.entry);
  if (!thread) return null;
  await prisma.followUpNote.upsert({
    where: { id: `log-${args.logId}` },
    create: {
      id: `log-${args.logId}`,
      tenantId: args.tenantId,
      ...thread,
      authorId: args.authorProfileId,
      body: args.body,
      ...(args.at && { createdAt: args.at }),
    },
    update: {},
  });
  return thread;
}
