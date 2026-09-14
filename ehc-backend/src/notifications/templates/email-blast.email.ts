import type { SendEmailPayload } from '../notification-events';
import { renderEmailLayout } from './layout';

interface Args {
  email: string;
  subject: string;
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
export function buildEmailBlast({ email, subject, body, attachments }: Args): SendEmailPayload {
  const text = [toPlainText(body), '', '— Everlasting Hills Church · Ibadan'].join('\n');
  // No card heading: the subject line already carries it, and the composer's
  // body is the whole message — repeating it read like a duplicated title.
  const html = renderEmailLayout({ bodyHtml: styleInlineImages(body) });

  return {
    to: email,
    subject,
    text,
    html,
    tag: 'email-blast',
    ...(attachments?.length ? { attachments: attachments.map((a) => ({ filename: a.name, url: a.url })) } : {}),
  };
}
