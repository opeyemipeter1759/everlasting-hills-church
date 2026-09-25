import type { SendEmailPayload } from '../notification-events';
import { fillNameTokens, greetingHtml, greetingText, hasNameToken, renderEmailLayout } from './layout';

interface Args {
  email: string;
  /** Recipient's first name — opens the message with "Hello Daphne,". */
  firstName?: string | null;
  subject: string;
  /** Salutation chosen for this particular email ("Dear"). Null/absent = church default. */
  greeting?: string | null;
  /** Rich-text HTML from the admin composer (Tiptap, schema-limited — sanitized
   * by construction, same trust level as ReportEditor's saved report content). */
  body: string;
  attachments?: { name: string; url: string }[];
}

/** Images dropped into the composer arrive as bare <img src>. Email clients
 * ignore stylesheets, so give each one inline sizing so it never overflows the
 * 560px card. */
function styleInlineImages(html: string): string {
  return html.replace(
    /<img\b(?![^>]*\bstyle=)/g,
    '<img style="max-width:100%;height:auto;display:block;border-radius:8px;margin:12px 0"',
  );
}

/** Strips tags for the plain-text fallback Resend sends alongside the HTML. */
function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Admin-authored, freely-targeted email (the "Emails" admin feature) — no fixed CTA/destination. */
export function buildEmailBlast({ email, firstName, subject, greeting, body, attachments }: Args): SendEmailPayload {
  // Personalised per recipient: "{{firstName}}" placeholders are filled in, and
  // unless the author placed the name themselves the message opens with a
  // "Hello Daphne," line.
  const personalSubject = fillNameTokens(subject, firstName);
  const personalBody = fillNameTokens(body, firstName, true);
  const autoGreet = !hasNameToken(body);

  const text = [
    ...(autoGreet ? [greetingText(firstName, greeting), ''] : []),
    toPlainText(personalBody),
    '',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');
  // No card heading: the subject line already carries it, and the composer's
  // body is the whole message — repeating it read like a duplicated title.
  const html = renderEmailLayout({
    bodyHtml: `${autoGreet ? greetingHtml(firstName, greeting) : ''}${styleInlineImages(personalBody)}`,
  });

  return {
    to: email,
    subject: personalSubject,
    text,
    html,
    tag: 'email-blast',
    memberOnly: true,
    ...(attachments?.length ? { attachments: attachments.map((a) => ({ filename: a.name, url: a.url })) } : {}),
  };
}
