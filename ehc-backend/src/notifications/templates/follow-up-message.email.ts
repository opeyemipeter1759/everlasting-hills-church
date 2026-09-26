import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  to: string;
  recipientFirstName: string;
  /** Who posted the message. */
  authorName: string;
  /** The person the thread is about. */
  subjectName: string;
  message: string;
  /** Why this person is hearing about it: they're assigned, or they're in the conversation. */
  reason: 'assignee' | 'participant';
  /** The board to open: Follow Up, or Integration for integrated members. */
  url: string;
}

/** Long messages are cut for the email; the full thread is one click away. */
const MAX_QUOTE = 400;

/**
 * "Someone posted on a follow-up thread you're part of" — sent to the
 * assignee and everyone else who has posted there, never to the author.
 */
export function buildFollowUpMessageEmail({
  to,
  recipientFirstName,
  authorName,
  subjectName,
  message,
  reason,
  url,
}: Args): SendEmailPayload {
  const quote = message.length > MAX_QUOTE ? `${message.slice(0, MAX_QUOTE).trimEnd()}…` : message;
  const why =
    reason === 'assignee'
      ? `You're assigned to ${subjectName}, so you're hearing about new activity on their follow-up.`
      : `You've been part of the conversation about ${subjectName}.`;

  const text = [
    `Hi ${recipientFirstName},`,
    '',
    `${authorName} posted new activity about ${subjectName}:`,
    '',
    quote,
    '',
    why,
    '',
    `Reply or read the thread: ${url}`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(recipientFirstName)},</p>
    <p style="margin:0 0 12px"><strong>${escapeHtml(authorName)}</strong> posted new activity about <strong>${escapeHtml(subjectName)}</strong>:</p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #87102C;background:#FFF7F9;white-space:pre-wrap">${escapeHtml(quote)}</blockquote>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHtml(why)}</p>
  `;

  return {
    to,
    subject: `New activity on ${subjectName}'s follow-up`,
    text,
    html: renderEmailLayout({
      heading: `New activity: ${escapeHtml(subjectName)}`,
      bodyHtml,
      cta: { label: 'Reply or read the thread', href: url },
    }),
    tag: 'follow-up-message',
    memberOnly: true,
  };
}
