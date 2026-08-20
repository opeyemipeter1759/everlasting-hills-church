import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  email: string;
  subject: string;
  /** Rich-text HTML from the admin composer (Tiptap, schema-limited — sanitized
   * by construction, same trust level as ReportEditor's saved report content). */
  body: string;
}

/** Strips tags for the plain-text fallback Resend sends alongside the HTML. */
function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Admin-authored, freely-targeted email (the "Emails" admin feature) — no fixed CTA/destination. */
export function buildEmailBlast({ email, subject, body }: Args): SendEmailPayload {
  const text = [toPlainText(body), '', '— Everlasting Hills Church · Ibadan'].join('\n');
  const html = renderEmailLayout({ heading: escapeHtml(subject), bodyHtml: body });

  return { to: email, subject, text, html, tag: 'email-blast' };
}
